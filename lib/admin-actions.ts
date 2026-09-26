"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";

function text(form: FormData, key: string, max = 500) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function number(form: FormData, key: string, fallback = 0) {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `category-${Date.now()}`
  );
}
async function saveFile(
  form: FormData,
  key: string,
  prefix: string,
): Promise<string | undefined> {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > 5 * 1024 * 1024) throw new Error("Файл больше 5 МБ");
  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext))
    throw new Error("Неподдерживаемый формат изображения");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function createCategoryAction(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 120);
  if (name.length < 2) throw new Error("Укажите название категории");
  const image = await saveFile(form, "image", "category");
  let slug = slugify(text(form, "slug", 100) || name);
  const used = await prisma.category.findUnique({ where: { slug } });
  if (used) slug = `${slug}-${Date.now().toString().slice(-5)}`;
  await prisma.category.create({
    data: {
      name,
      slug,
      description: text(form, "description", 1000) || null,
      image,
      sortOrder: number(form, "sortOrder", 0),
    },
  });
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(form: FormData) {
  await requireAdmin();
  const id = number(form, "id");
  if (await prisma.product.count({ where: { categoryId: id } }))
    throw new Error("Сначала перенесите или удалите товары категории");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function createStoreAction(form: FormData) {
  const user = await requireAdmin();
  const image = await saveFile(form, "exteriorImage", "store");
  const latitude = text(form, "latitude") ? number(form, "latitude") : null;
  const longitude = text(form, "longitude") ? number(form, "longitude") : null;
  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    throw new Error("Укажите точку магазина на карте.");
  const store = await prisma.store.create({
    data: {
      name: text(form, "name", 150),
      phone: text(form, "phone", 40) || null,
      address: text(form, "address", 250),
      latitude,
      longitude,
      exteriorImage: image,
      contactName: text(form, "contactName", 120) || null,
      openingHours: text(form, "openingHours", 120) || null,
      notes: text(form, "notes", 1000) || null,
      status: text(form, "status", 40) || "LEAD",
      source: "FIELD",
      createdById: user.id,
    },
  });
  const shelfCode = text(form, "shelfCode", 32).toUpperCase();
  if (shelfCode) {
    await prisma.shelf.upsert({
      where: { code: shelfCode },
      update: { storeId: store.id, status: "INSTALLED", installedAt: new Date() },
      create: {
        code: shelfCode,
        storeId: store.id,
        status: "INSTALLED",
        installedAt: new Date(),
      },
    });
  }
  revalidatePath("/admin/stores");
  revalidatePath("/admin/shelves");
}

export async function createShelfAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code", 32).toUpperCase();
  if (!/^[A-ZА-Я0-9-]{2,32}$/i.test(code))
    throw new Error("Некорректный номер полки");
  const storeId = number(form, "storeId", 0) || null;
  await prisma.shelf.create({
    data: {
      code,
      storeId,
      status: storeId ? "INSTALLED" : "IN_STOCK",
      installedAt: storeId ? new Date() : null,
      notes: text(form, "notes", 500) || null,
    },
  });
  revalidatePath("/admin/shelves");
  revalidatePath("/admin/stores");
}

export async function createPromotionAction(form: FormData) {
  await requireAdmin();
  const image = await saveFile(form, "image", "promo");
  await prisma.promotion.create({
    data: {
      title: text(form, "title", 160),
      subtitle: text(form, "subtitle", 300) || null,
      badge: text(form, "badge", 60) || null,
      image,
      sortOrder: number(form, "sortOrder"),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}

export async function deletePromotionAction(form: FormData) {
  await requireAdmin();
  await prisma.promotion.delete({ where: { id: number(form, "id") } });
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}

export async function createFinanceEntryAction(form: FormData) {
  const user = await requireAdmin();
  if (user.role !== "DIRECTOR")
    throw new Error("Финансы доступны только генеральному директору.");
  const type = text(form, "type", 20);
  const amount = Math.max(0, number(form, "amount"));
  const category = text(form, "category", 80);
  if (!["INCOME", "EXPENSE"].includes(type) || amount <= 0 || category.length < 2)
    throw new Error("Укажите корректную операцию, статью и сумму.");
  const knownCategory = await prisma.financeCategory.findUnique({
    where: { name_type: { name: category, type } },
  });
  if (!knownCategory?.active)
    throw new Error("Выберите активную статью соответствующего типа или сначала добавьте её ниже.");
  const storeId = Math.trunc(number(form, "storeId", 0)) || null;
  const entryData = {
    type,
    category,
    amount,
    note: text(form, "note", 500) || null,
    entryDate: form.get("entryDate")
      ? new Date(String(form.get("entryDate")) + "T12:00:00")
      : new Date(),
    storeId,
    paymentMethod: text(form, "paymentMethod", 40) || null,
    createdById: user.id,
  };
  if (type === "INCOME" && category === "Оплата магазина") {
    if (!storeId) throw new Error("Для оплаты магазина выберите магазин.");
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { debt: true },
    });
    if (!store || store.debt <= 0)
      throw new Error("У выбранного магазина нет задолженности.");
    if (amount > store.debt)
      throw new Error("Сумма оплаты больше текущего долга магазина.");
    await prisma.$transaction([
      prisma.store.update({
        where: { id: storeId },
        data: { debt: store.debt - amount },
      }),
      prisma.financeEntry.create({ data: entryData }),
    ]);
  } else {
    await prisma.financeEntry.create({ data: entryData });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/stores");
}

export async function createSpoilageAction(form: FormData) {
  const user = await requireAdmin();
  const productId = number(form, "productId");
  const quantity = Math.max(1, Math.trunc(number(form, "quantity", 1)));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Товар не найден");
  const photo = await saveFile(form, "photo", "spoilage");
  await prisma.$transaction([
    prisma.spoilage.create({
      data: {
        productId,
        userId: user.id,
        quantity,
        amount: number(form, "amount", product.purchasePrice * quantity),
        reason: text(form, "reason", 300),
        photo,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: Math.min(quantity, product.stock) } },
    }),
    prisma.inventoryMovement.create({
      data: {
        productId,
        userId: user.id,
        type: "SPOILAGE",
        quantity: -quantity,
        note: text(form, "reason", 300),
      },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/spoilage");
  revalidatePath("/admin/products");
}

export async function createComplaintAction(form: FormData) {
  const user = await requireAdmin();
  const type = text(form, "type", 20) === "SUGGESTION" ? "SUGGESTION" : "COMPLAINT";
  await prisma.complaint.create({
    data: {
      storeId: number(form, "storeId"),
      type,
      title: text(form, "title", 180),
      description: text(form, "description", 2000),
      status: "NEW",
      createdById: user.id,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/complaints");
}

export async function updateComplaintStatusAction(form: FormData) {
  await requireAdmin();
  await prisma.complaint.update({
    where: { id: number(form, "id") },
    data: {
      status: text(form, "status", 30),
      resolution: text(form, "resolution", 1000) || undefined,
    },
  });
  revalidatePath("/admin/complaints");
  revalidatePath("/admin");
}

export async function updateSettingsAction(form: FormData) {
  await requireAdmin();
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      brandName: text(form, "brandName", 80),
      tagline: text(form, "tagline", 180),
      phone: text(form, "phone", 40),
      email: text(form, "email", 100),
      city: text(form, "city", 100),
    },
    create: {
      id: 1,
      brandName: text(form, "brandName", 80),
      tagline: text(form, "tagline", 180),
      phone: text(form, "phone", 40),
      email: text(form, "email", 100),
      city: text(form, "city", 100),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function approveStoreAction(form: FormData) {
  await requireAdmin();
  const id = number(form, "id");
  await prisma.store.update({
    where: { id },
    data: { needsReview: false, status: "ACTIVE" },
  });
  revalidatePath("/admin/stores");
}

export async function mergeStoreAction(form: FormData) {
  await requireAdmin();
  const sourceId = number(form, "sourceId");
  const targetId = number(form, "targetId");
  if (!sourceId || !targetId || sourceId === targetId)
    throw new Error("Выберите другой существующий магазин");
  const source = await prisma.store.findUnique({
    where: { id: sourceId },
    include: { memberships: true },
  });
  const target = await prisma.store.findUnique({ where: { id: targetId } });
  if (!source || !target) throw new Error("Магазин не найден");
  await prisma.$transaction(async (tx) => {
    for (const membership of source.memberships) {
      await tx.storeMembership.upsert({
        where: {
          userId_storeId: { userId: membership.userId, storeId: targetId },
        },
        update: { active: true, role: membership.role },
        create: {
          userId: membership.userId,
          storeId: targetId,
          role: membership.role,
        },
      });
    }
    await tx.order.updateMany({
      where: { storeId: sourceId },
      data: { storeId: targetId },
    });
    await tx.shelf.updateMany({
      where: { storeId: sourceId },
      data: { storeId: targetId },
    });
    await tx.routeStop.updateMany({
      where: { storeId: sourceId },
      data: { storeId: targetId },
    });
    await tx.complaint.updateMany({
      where: { storeId: sourceId },
      data: { storeId: targetId },
    });
    await tx.financeEntry.updateMany({
      where: { storeId: sourceId },
      data: { storeId: targetId },
    });
    await tx.storeMembership.deleteMany({ where: { storeId: sourceId } });
    await tx.store.delete({ where: { id: sourceId } });
    await tx.store.update({
      where: { id: targetId },
      data: {
        needsReview: false,
        status: "ACTIVE",
        debt: { increment: source.debt },
        ...(target.routeLineId
          ? {}
          : source.routeLineId
            ? { routeLineId: source.routeLineId, routeOrder: source.routeOrder }
            : {}),
      },
    });
  });
  revalidatePath("/admin/stores");
  revalidatePath("/profile");
}

export async function updateStoreAction(form: FormData) {
  await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  const name = text(form, "name", 150);
  const address = text(form, "address", 250);
  const latitudeText = text(form, "latitude", 80);
  const longitudeText = text(form, "longitude", 80);
  const latitude = latitudeText ? number(form, "latitude") : null;
  const longitude = longitudeText ? number(form, "longitude") : null;
  const routeLineId = Math.trunc(number(form, "routeLineId", 0)) || null;
  if (!id || name.length < 2 || address.length < 4)
    throw new Error("Заполните название и адрес магазина.");
  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    throw new Error("Укажите точку магазина на карте.");
  await prisma.store.update({
    where: { id },
    data: {
      name,
      phone: text(form, "phone", 40) || null,
      address,
      latitude,
      longitude,
      contactName: text(form, "contactName", 120) || null,
      openingHours: text(form, "openingHours", 120) || null,
      notes: text(form, "notes", 2000) || null,
      status: text(form, "status", 40) || "ACTIVE",
      debt: Math.max(0, number(form, "debt", 0)),
      routeLineId,
      routeOrder: Math.max(0, Math.trunc(number(form, "routeOrder", 0))),
    },
  });
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${id}`);
  revalidatePath("/admin/routes");
  revalidatePath("/field");
  revalidatePath(`/field/stores/${id}`);
}

export async function createRouteLineAction(form: FormData) {
  await requireAdmin();
  const title = text(form, "title", 120);
  if (title.length < 2) throw new Error("Укажите название линии.");
  await prisma.routeLine.create({
    data: {
      title,
      areaSummary: text(form, "areaSummary", 500) || null,
      notes: text(form, "notes", 1000) || null,
    },
  });
  revalidatePath("/admin/routes");
}

export async function updateRouteLineAction(form: FormData) {
  await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  await prisma.routeLine.update({
    where: { id },
    data: {
      title: text(form, "title", 120),
      areaSummary: text(form, "areaSummary", 500) || null,
      notes: text(form, "notes", 1000) || null,
      active: String(form.get("active")) !== "false",
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function moveStoresToLineAction(form: FormData) {
  await requireAdmin();
  const targetLineId = Math.trunc(number(form, "targetLineId", 0)) || null;
  const ids = form
    .getAll("storeIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (!ids.length) throw new Error("Выберите хотя бы один магазин.");
  const moving = await prisma.store.findMany({
    where: { id: { in: ids } },
    select: { id: true, routeLineId: true },
  });
  const affectedSourceLines = Array.from(
    new Set(
      moving
        .map((store) => store.routeLineId)
        .filter((id): id is number => id !== null && id !== targetLineId),
    ),
  );
  const lastTarget = targetLineId
    ? await prisma.store.findFirst({
        where: { routeLineId: targetLineId, id: { notIn: ids } },
        orderBy: [{ routeOrder: "desc" }, { id: "desc" }],
        select: { routeOrder: true },
      })
    : null;
  let nextOrder = (lastTarget?.routeOrder ?? 0) + 1;
  await prisma.$transaction(async (tx) => {
    for (const id of ids) {
      await tx.store.update({
        where: { id },
        data: { routeLineId: targetLineId, routeOrder: targetLineId ? nextOrder++ : 0 },
      });
    }
    for (const sourceLineId of affectedSourceLines) {
      const remaining = await tx.store.findMany({
        where: { routeLineId: sourceLineId },
        select: { id: true },
        orderBy: [{ routeOrder: "asc" }, { id: "asc" }],
      });
      for (let index = 0; index < remaining.length; index++)
        await tx.store.update({
          where: { id: remaining[index].id },
          data: { routeOrder: index + 1 },
        });
    }
  });
  revalidatePath("/admin/routes");
  revalidatePath("/admin/stores");
  revalidatePath("/field");
}

export async function createDeliveryRouteAction(form: FormData) {
  await requireAdmin();
  const lineId = Math.trunc(number(form, "lineId"));
  const assignedUserId = Math.trunc(number(form, "assignedUserId", 0)) || null;
  const dateValue = text(form, "routeDate", 30);
  const line = await prisma.routeLine.findUnique({ where: { id: lineId } });
  if (!line || !dateValue) throw new Error("Выберите линию и дату.");
  const onlyWithOrders = form.get("onlyWithOrders") === "on";
  const stores = await prisma.store.findMany({
    where: { routeLineId: lineId, status: { not: "PAUSED" } },
    include: {
      orders: {
        where: { status: { in: ["NEW", "PROCESSING"] }, routeStop: null },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: [{ routeOrder: "asc" }, { id: "asc" }],
  });
  const selected = onlyWithOrders
    ? stores.filter((store) => store.orders.length > 0)
    : stores;
  if (!selected.length)
    throw new Error("В этой линии нет подходящих магазинов.");
  await prisma.deliveryRoute.create({
    data: {
      title: text(form, "title", 160) || `${line.title} — ${dateValue}`,
      routeDate: new Date(`${dateValue}T12:00:00`),
      lineId,
      assignedUserId,
      notes: text(form, "notes", 1000) || null,
      stops: {
        create: selected.map((store, index) => ({
          storeId: store.id,
          orderId: store.orders[0]?.id ?? null,
          sequence: index + 1,
          note: store.notes || null,
        })),
      },
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function addRouteStopAction(form: FormData) {
  await requireAdmin();
  const routeId = Math.trunc(number(form, "routeId"));
  const storeId = Math.trunc(number(form, "storeId"));
  const existing = await prisma.routeStop.findFirst({
    where: { routeId, storeId },
  });
  if (existing) throw new Error("Этот магазин уже есть в маршруте.");
  const last = await prisma.routeStop.findFirst({
    where: { routeId },
    orderBy: { sequence: "desc" },
  });
  const order = await prisma.order.findFirst({
    where: {
      storeId,
      status: { in: ["NEW", "PROCESSING"] },
      routeStop: null,
    },
    orderBy: { createdAt: "asc" },
  });
  await prisma.routeStop.create({
    data: {
      routeId,
      storeId,
      orderId: order?.id ?? null,
      sequence: (last?.sequence ?? 0) + 1,
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function removeRouteStopAction(form: FormData) {
  await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  const stop = await prisma.routeStop.findUnique({
    where: { id },
    select: { routeId: true },
  });
  if (!stop) return;
  await prisma.$transaction(async (tx) => {
    await tx.routeStop.delete({ where: { id } });
    const remaining = await tx.routeStop.findMany({
      where: { routeId: stop.routeId },
      select: { id: true },
      orderBy: [{ sequence: "asc" }, { id: "asc" }],
    });
    for (let index = 0; index < remaining.length; index++)
      await tx.routeStop.update({
        where: { id: remaining[index].id },
        data: { sequence: index + 1 },
      });
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function moveRouteStopAction(form: FormData) {
  await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  const direction = text(form, "direction", 10);
  const stop = await prisma.routeStop.findUnique({ where: { id } });
  if (!stop) return;
  const neighbor = await prisma.routeStop.findFirst({
    where: {
      routeId: stop.routeId,
      sequence:
        direction === "up" ? { lt: stop.sequence } : { gt: stop.sequence },
    },
    orderBy: { sequence: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await prisma.$transaction(async (tx) => {
    await tx.routeStop.update({
      where: { id: stop.id },
      data: { sequence: -Math.abs(stop.id) - 100000 },
    });
    await tx.routeStop.update({
      where: { id: neighbor.id },
      data: { sequence: stop.sequence },
    });
    await tx.routeStop.update({
      where: { id: stop.id },
      data: { sequence: neighbor.sequence },
    });
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function createFinanceCategoryAction(form: FormData) {
  const user = await requireAdmin();
  if (user.role !== "DIRECTOR") throw new Error("Недостаточно прав.");
  const name = text(form, "name", 80);
  const type = text(form, "type", 20);
  if (name.length < 2 || !["INCOME", "EXPENSE"].includes(type))
    throw new Error("Заполните категорию.");
  await prisma.financeCategory.upsert({
    where: { name_type: { name, type } },
    update: { active: true },
    create: { name, type },
  });
  revalidatePath("/admin/finance");
}

export async function toggleFinanceCategoryAction(form: FormData) {
  const user = await requireAdmin();
  if (user.role !== "DIRECTOR") throw new Error("Недостаточно прав.");
  const id = Math.trunc(number(form, "id"));
  const category = await prisma.financeCategory.findUnique({ where: { id } });
  if (!category) return;
  await prisma.financeCategory.update({
    where: { id },
    data: { active: !category.active },
  });
  revalidatePath("/admin/finance");
}

export async function reverseFinanceEntryAction(form: FormData) {
  const user = await requireAdmin();
  if (user.role !== "DIRECTOR") throw new Error("Недостаточно прав.");
  const id = Math.trunc(number(form, "id"));
  const entry = await prisma.financeEntry.findUnique({ where: { id } });
  if (!entry || entry.isReversal) return;
  const existing = await prisma.financeEntry.findFirst({
    where: { reversalOfId: id, isReversal: true },
  });
  if (existing) return;
  await prisma.$transaction(async (tx) => {
    await tx.financeEntry.create({
      data: {
        type: entry.type,
        category: entry.category,
        amount: -entry.amount,
        note: `Сторно операции №${entry.id}${entry.note ? ` — ${entry.note}` : ""}`,
        entryDate: new Date(),
        storeId: entry.storeId,
        paymentMethod: entry.paymentMethod,
        isReversal: true,
        reversalOfId: entry.id,
        createdById: user.id,
      },
    });
    if (
      entry.type === "INCOME" &&
      entry.category === "Оплата магазина" &&
      entry.storeId
    ) {
      await tx.store.update({
        where: { id: entry.storeId },
        data: { debt: { increment: entry.amount } },
      });
    }
  });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  revalidatePath("/admin/stores");
}

export async function updateDeliveryRouteAction(form: FormData) {
  await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  const dateValue = text(form, "routeDate", 30);
  const assignedUserId = Math.trunc(number(form, "assignedUserId", 0)) || null;
  if (!id || !dateValue) throw new Error("Укажите маршрут и дату.");
  await prisma.deliveryRoute.update({
    where: { id },
    data: {
      title: text(form, "title", 160),
      routeDate: new Date(`${dateValue}T12:00:00`),
      assignedUserId,
      status: text(form, "status", 30) || "PLANNED",
      notes: text(form, "notes", 1000) || null,
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}

export async function createStaffAction(form: FormData) {
  const current = await requireAdmin();
  const name = text(form, "name", 120);
  const phone = normalizePhone(text(form, "phone", 40));
  const password = text(form, "password", 120);
  const role = text(form, "role", 30);
  const allowed =
    current.role === "DIRECTOR"
      ? ["ADMIN", "FIELD", "DRIVER", "MANAGER", "WAREHOUSE"]
      : ["FIELD", "DRIVER", "MANAGER", "WAREHOUSE"];
  if (name.length < 2 || !phone || password.length < 8 || !allowed.includes(role))
    throw new Error("Проверьте имя, российский телефон, пароль и роль сотрудника.");
  await prisma.user.create({
    data: {
      name,
      phone,
      shopName: "ПЕРСПЕКТИВА",
      role,
      active: true,
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/routes");
}

export async function updateStaffAction(form: FormData) {
  const current = await requireAdmin();
  const id = Math.trunc(number(form, "id"));
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "DIRECTOR")
    throw new Error("Эту учётную запись нельзя изменить здесь.");
  const role = text(form, "role", 30);
  const allowed =
    current.role === "DIRECTOR"
      ? ["ADMIN", "FIELD", "DRIVER", "MANAGER", "WAREHOUSE"]
      : ["FIELD", "DRIVER", "MANAGER", "WAREHOUSE"];
  if (!allowed.includes(role)) throw new Error("Недостаточно прав для этой роли.");
  const password = text(form, "password", 120);
  const data = {
    name: text(form, "name", 120) || target.name,
    role,
    active: form.get("active") === "true",
    ...(password ? { passwordHash: await hashPassword(password) } : {}),
  };
  if (password) {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data }),
      prisma.session.deleteMany({ where: { userId: id } }),
    ]);
  } else {
    await prisma.user.update({ where: { id }, data });
  }
  revalidatePath("/admin/team");
  revalidatePath("/admin/routes");
}

export async function moveStoreInLineAction(form: FormData) {
  await requireAdmin();
  const raw = text(form, "moveStore", 80);
  const [idText, direction] = raw.split(":");
  const storeId = Number(idText);
  if (!Number.isInteger(storeId) || !["up", "down"].includes(direction)) return;
  const current = await prisma.store.findUnique({
    where: { id: storeId },
    select: { routeLineId: true },
  });
  if (!current?.routeLineId) return;
  const stores = await prisma.store.findMany({
    where: { routeLineId: current.routeLineId },
    select: { id: true },
    orderBy: [{ routeOrder: "asc" }, { id: "asc" }],
  });
  const index = stores.findIndex((store) => store.id === storeId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= stores.length) return;
  [stores[index], stores[target]] = [stores[target], stores[index]];
  await prisma.$transaction(
    stores.map((store, position) =>
      prisma.store.update({
        where: { id: store.id },
        data: { routeOrder: position + 1 },
      }),
    ),
  );
  revalidatePath("/admin/routes");
  revalidatePath("/field");
}