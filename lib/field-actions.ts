"use server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";

function text(form: FormData, key: string, max = 500) { const v = form.get(key); return typeof v === "string" ? v.trim().slice(0, max) : ""; }
function num(form: FormData, key: string) { const v = Number(form.get(key)); return Number.isFinite(v) ? v : null; }
async function saveImage(form: FormData, key: string) {
  const file = form.get(key); if (!(file instanceof File) || file.size === 0) return undefined;
  const ext = path.extname(file.name).toLowerCase() || ".jpg"; const dir = path.join(process.cwd(), "public", "uploads"); await mkdir(dir, { recursive: true });
  const name = `field-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`; await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer())); return `/uploads/${name}`;
}
export async function createFieldStoreAction(form: FormData) {
  const user = await requireField(); const image = await saveImage(form, "exteriorImage");
  const latitude = num(form, "latitude"); const longitude = num(form, "longitude");
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error("Укажите точку магазина на карте.");
  const store = await prisma.store.create({ data: { name: text(form,"name",150), phone: text(form,"phone",40)||null, address: text(form,"address",250), latitude, longitude, exteriorImage:image, contactName:text(form,"contactName",120)||null, openingHours:text(form,"openingHours",120)||null, notes:text(form,"notes",1000)||null, status:"LEAD", source:"FIELD", createdById:user.id } });
  const shelfCode = text(form,"shelfCode",32).toUpperCase();
  if (shelfCode) await prisma.shelf.upsert({ where:{code:shelfCode}, update:{storeId:store.id,status:"INSTALLED",installedAt:new Date()}, create:{code:shelfCode,storeId:store.id,status:"INSTALLED",installedAt:new Date()} });
  revalidatePath("/field"); revalidatePath("/admin/stores"); redirect(`/field/stores/${store.id}`);
}
export async function updateStopAction(form: FormData) {
  await requireField();
  const id = Number(form.get("id"));
  const status = text(form,"status",30);
  const note = text(form,"note",1000)||null;
  if (!Number.isInteger(id) || id <= 0 || !["PLANNED", "ARRIVED", "DONE", "PROBLEM"].includes(status)) throw new Error("Некорректный статус визита.");
  const stop = await prisma.routeStop.findUnique({ where:{id}, include:{ order:true } });
  if (!stop) throw new Error("Точка маршрута не найдена.");
  await prisma.$transaction(async (tx) => {
    await tx.routeStop.update({ where:{id}, data:{status,note} });
    if (status === "DONE" && stop.status !== "DONE" && stop.order && stop.order.status !== "CANCELLED") {
      if (stop.order.paymentStatus === "UNPAID" && !stop.order.debtPosted && stop.order.storeId) {
        await tx.store.update({ where:{id:stop.order.storeId}, data:{ debt:{ increment:stop.order.total } } });
        await tx.order.update({ where:{id:stop.order.id}, data:{ status:"COMPLETED", debtPosted:true, debtAmount:stop.order.total } });
      } else if (stop.order.status !== "COMPLETED") {
        await tx.order.update({ where:{id:stop.order.id}, data:{ status:"COMPLETED" } });
      }
    }
    const remaining = await tx.routeStop.count({ where:{ routeId:stop.routeId, id:{ not:id }, status:{ not:"DONE" } } });
    if (status === "DONE" && remaining === 0) await tx.deliveryRoute.update({ where:{id:stop.routeId}, data:{ status:"DONE" } });
    else if (["ARRIVED", "DONE", "PROBLEM"].includes(status)) await tx.deliveryRoute.update({ where:{id:stop.routeId}, data:{ status:"IN_PROGRESS" } });
  });
  revalidatePath("/field"); revalidatePath(`/field/stops/${id}`); revalidatePath("/field/map"); revalidatePath("/admin/routes"); revalidatePath("/admin/stores"); revalidatePath("/admin/finance"); revalidatePath("/admin");
}

export async function startRouteAction(form: FormData) {
  const user = await requireField();
  const routeId = Number(form.get("routeId"));
  if (!Number.isInteger(routeId) || routeId <= 0) {
    throw new Error("Некорректный маршрут.");
  }

  const route = await prisma.deliveryRoute.findUnique({
    where: { id: routeId },
  });
  if (!route) throw new Error("Маршрут не найден.");

  if (
    ["FIELD", "DRIVER"].includes(user.role) &&
    route.assignedUserId !== user.id
  ) {
    throw new Error("Это не ваш маршрут.");
  }

  if (route.status === "DONE") {
    throw new Error("Маршрут уже завершён.");
  }

  if (route.status === "IN_PROGRESS") {
    return;
  }

  await prisma.deliveryRoute.update({
    where: { id: routeId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/field");
  revalidatePath("/admin/routes");
}
export async function sellFromVehicleAction(form: FormData) {
  const user = await requireField();

  const productId = Number(form.get("productId"));
  const storeId = Number(form.get("storeId"));
  const quantity = Math.max(1, Math.trunc(Number(form.get("quantity"))));
  const paymentMethod = String(form.get("paymentMethod") || "CASH");
  const note = text(form, "note", 500) || null;

  if (!Number.isInteger(productId) || !Number.isInteger(storeId)) {
    throw new Error("Не указан товар или магазин.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new Error("Товар не найден.");

  const inventory = await prisma.driverInventory.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  const inCar = inventory?.quantity ?? 0;
  if (inCar < quantity) {
    throw new Error("Недостаточно товара в машине.");
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Магазин не найден.");

  const total = product.price * quantity;
  const isDebt = paymentMethod === "DEBT";

  await prisma.$transaction(async (tx) => {
    // 1. Уменьшаем товар у водителя
    await tx.driverInventory.update({
      where: { userId_productId: { userId: user.id, productId } },
      data: { quantity: { decrement: quantity } },
    });

    // 2. Создаём заказ (продажа)
    const order = await tx.order.create({
      data: {
        userId: user.id,
        storeId,
        status: "COMPLETED",
        paymentStatus: isDebt ? "UNPAID" : "PAID",
        total,
        comment: note,
        debtPosted: isDebt,
        debtAmount: isDebt ? total : 0,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              article: product.article,
              price: product.price,
              purchasePrice: product.purchasePrice,
              quantity,
            },
          ],
        },
      },
    });

    // 3. Если в долг — увеличиваем долг магазина
    if (isDebt) {
      await tx.store.update({
        where: { id: storeId },
        data: { debt: { increment: total } },
      });
    }

    // 4. Финансовая запись
    await tx.financeEntry.create({
      data: {
        type: "INCOME",
        category: isDebt ? "Продажа в долг" : "Продажа водителем",
        amount: total,
        note: `Заказ №${order.id}${note ? ` — ${note}` : ""}`,
        orderId: order.id,
        storeId,
        paymentMethod,
        createdById: user.id,
      },
    });
  });

  revalidatePath("/field");
  revalidatePath("/field/catalog");
  revalidatePath(`/field/stores/${storeId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect("/field/catalog");
}
export async function sellMultipleFromVehicleAction(form: FormData) {
  const user = await requireField();

  const storeId = Number(form.get("storeId"));
  const paymentMethod = String(form.get("paymentMethod") || "CASH");
  const note = text(form, "note", 500) || null;
  const itemsRaw = String(form.get("items") || "[]");

  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw new Error("Выберите магазин.");
  }

  type CartItem = {
    productId: number;
    quantity: number;
    price: number;
    name: string;
    article: string;
  };

  let cartItems: CartItem[];
  try {
    cartItems = JSON.parse(itemsRaw) as CartItem[];
  } catch {
    throw new Error("Некорректные данные корзины.");
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Корзина пуста.");
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Магазин не найден.");

  const productIds = cartItems.map((i) => Number(i.productId));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const myInventory = await prisma.driverInventory.findMany({
    where: { userId: user.id, productId: { in: productIds } },
  });
  const invMap = new Map(myInventory.map((r) => [r.productId, r]));

  let total = 0;
  const orderItemsData: {
    productId: number;
    productName: string;
    article: string;
    price: number;
    purchasePrice: number;
    quantity: number;
  }[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Товар не найден: ${item.name}`);
    const inv = invMap.get(item.productId);
    const inCar = inv?.quantity ?? 0;
    if (inCar < item.quantity) {
      throw new Error(`Недостаточно "${product.name}" в машине (осталось ${inCar}).`);
    }
    total += product.price * item.quantity;
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      article: product.article,
      price: product.price,
      purchasePrice: product.purchasePrice,
      quantity: item.quantity,
    });
  }

  const isDebt = paymentMethod === "DEBT";

  await prisma.$transaction(async (tx) => {
    // 1. Уменьшаем товар в машине
    for (const item of cartItems) {
      await tx.driverInventory.update({
        where: {
          userId_productId: {
            userId: user.id,
            productId: item.productId,
          },
        },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // 2. Создаём заказ
    const order = await tx.order.create({
      data: {
        userId: user.id,
        storeId,
        status: "COMPLETED",
        paymentStatus: isDebt ? "UNPAID" : "PAID",
        total,
        comment: note,
        debtPosted: isDebt,
        debtAmount: isDebt ? total : 0,
        items: { create: orderItemsData },
      },
    });

    // 3. Долг магазина
    if (isDebt) {
      await tx.store.update({
        where: { id: storeId },
        data: { debt: { increment: total } },
      });
    }

    // 4. Финансовая запись
    await tx.financeEntry.create({
      data: {
        type: "INCOME",
        category: isDebt ? "Продажа в долг" : "Продажа водителем",
        amount: total,
        note: `Заказ №${order.id}${note ? ` — ${note}` : ""}`,
        orderId: order.id,
        storeId,
        paymentMethod,
        createdById: user.id,
      },
    });
  });

  revalidatePath("/field");
  revalidatePath("/field/catalog");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect("/field/catalog");
}