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