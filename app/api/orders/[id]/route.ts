import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isOrderStatus } from "@/lib/order-status";
import { getApiAdmin } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };
function parseId(value: string): number | null { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }

export async function GET(_request: Request, context: RouteContext) {
  const admin = await getApiAdmin(); if (admin instanceof NextResponse) return admin;
  const { id: rawId } = await context.params; const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный номер заказа." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id }, include: { user: { select: { id:true,name:true,phone:true,shopName:true } }, store: { select: { id:true,name:true,address:true } }, items: { orderBy: { id:"asc" } } } });
  if (!order) return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await getApiAdmin(); if (admin instanceof NextResponse) return admin;
  const { id: rawId } = await context.params; const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный номер заказа." }, { status: 400 });
  try {
    const body = (await request.json()) as { status?: unknown };
    if (!isOrderStatus(body.status)) return NextResponse.json({ error: "Некорректный статус заказа." }, { status: 400 });
    const current = await prisma.order.findUnique({ where: { id }, include: { items: true, financeEntries: true } });
    if (!current) return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
    if (current.status === "CANCELLED" && body.status !== "CANCELLED") return NextResponse.json({ error: "Отменённый заказ нельзя восстановить. Создайте новый заказ." }, { status: 409 });

    await prisma.$transaction(async (tx) => {
      if (body.status === "CANCELLED" && current.status !== "CANCELLED") {
        for (const item of current.items) {
          if (!item.productId) continue;
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.inventoryMovement.create({ data: { productId: item.productId, userId: admin.id, type: "ORDER_CANCEL_RETURN", quantity: item.quantity, note: `Возврат резерва отменённого заказа №${current.id}` } });
        }
        if (current.debtPosted && current.storeId && current.debtAmount > 0) {
          const store = await tx.store.findUnique({ where: { id: current.storeId }, select: { debt: true } });
          if (store) await tx.store.update({ where: { id: current.storeId }, data: { debt: { decrement: Math.min(current.debtAmount, store.debt) } } });
        }
        for (const entry of current.financeEntries) {
          if (entry.isReversal || entry.amount <= 0) continue;
          const alreadyReversed = await tx.financeEntry.findFirst({ where: { reversalOfId: entry.id, isReversal: true } });
          if (!alreadyReversed) await tx.financeEntry.create({ data: {
            type: entry.type, category: entry.category, amount: -entry.amount, note: `Отмена заказа №${current.id}: сторно операции №${entry.id}`,
            entryDate: new Date(), orderId: current.id, storeId: entry.storeId, paymentMethod: entry.paymentMethod, isReversal: true, reversalOfId: entry.id, createdById: admin.id,
          } });
        }
        await tx.order.update({ where: { id }, data: { status: "CANCELLED", debtPosted: false, debtAmount: 0 } });
        return;
      }
      const shouldPostDebt = body.status === "COMPLETED" && current.status !== "COMPLETED" && current.paymentStatus === "UNPAID" && !current.debtPosted && Boolean(current.storeId);
      if (shouldPostDebt && current.storeId) {
        await tx.store.update({ where: { id: current.storeId }, data: { debt: { increment: current.total } } });
        await tx.order.update({ where: { id }, data: { status: body.status, debtPosted: true, debtAmount: current.total } });
      } else await tx.order.update({ where: { id }, data: { status: body.status } });
    });

    const order = await prisma.order.findUnique({ where: { id }, include: { user: { select: { id:true,name:true,phone:true,shopName:true } }, store: { select: { id:true,name:true,address:true } }, items: { orderBy: { id:"asc" } } } });
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
    console.error(error); return NextResponse.json({ error: "Не удалось изменить статус заказа." }, { status: 500 });
  }
}
