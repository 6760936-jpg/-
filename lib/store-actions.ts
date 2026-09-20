"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

function text(form: FormData, key: string, max = 500) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function num(form: FormData, key: string, fallback = 0) {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function registerStorePaymentAction(form: FormData) {
  const user = await requireRoles(["DIRECTOR", "ADMIN", "FIELD", "DRIVER"], "/field");
  const storeId = Math.trunc(num(form, "storeId"));
  const amount = Math.max(0, num(form, "amount"));
  const method = text(form, "paymentMethod", 40) || "Наличные";
  const note = text(form, "note", 500) || null;
  if (!storeId || amount <= 0) throw new Error("Укажите сумму оплаты.");
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Магазин не найден.");
  if (store.debt <= 0) throw new Error("У магазина нет задолженности.");
  if (amount > store.debt) throw new Error(`Сумма оплаты больше текущего долга (${store.debt.toFixed(2)} ₽).`);

  await prisma.$transaction(async (tx) => {
    await tx.store.update({ where: { id: storeId }, data: { debt: store.debt - amount } });
    await tx.financeEntry.create({
      data: {
        type: "INCOME",
        category: "Оплата магазина",
        amount,
        note,
        storeId,
        paymentMethod: method,
        entryDate: new Date(),
        createdById: user.id,
      },
    });
  });
  revalidatePath("/field");
  revalidatePath(`/field/stores/${storeId}`);
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeId}`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function updateStoreInternalNoteAction(form: FormData) {
  await requireRoles(["DIRECTOR", "ADMIN", "FIELD", "DRIVER"], "/field");
  const storeId = Math.trunc(num(form, "storeId"));
  const notes = text(form, "notes", 2000) || null;
  if (!storeId) throw new Error("Магазин не найден.");
  await prisma.store.update({ where: { id: storeId }, data: { notes } });
  revalidatePath("/field");
  revalidatePath(`/field/stores/${storeId}`);
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeId}`);
  revalidatePath("/field/map");
}
