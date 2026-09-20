import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiRoles } from "@/lib/api-auth";

type ItemInput = { productId?: unknown; quantity?: unknown };

export async function POST(request: Request) {
  const user = await getApiRoles(["DIRECTOR", "ADMIN", "FIELD", "DRIVER"]);
  if (user instanceof NextResponse) return user;
  try {
    const body = await request.json() as { storeId?: unknown; items?: unknown; comment?: unknown; paymentStatus?: unknown; paidAmount?: unknown; paymentMethod?: unknown };
    const storeId = Number(body.storeId);
    if (!Number.isInteger(storeId) || storeId <= 0) return NextResponse.json({ error: "Магазин не выбран." }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: "Добавьте товар." }, { status: 400 });
    const quantities = new Map<number, number>();
    for (const raw of body.items as ItemInput[]) {
      const id = Number(raw.productId), q = Number(raw.quantity);
      if (Number.isInteger(id) && id > 0 && Number.isInteger(q) && q > 0) quantities.set(id, (quantities.get(id) ?? 0) + q);
    }
    if (!quantities.size) return NextResponse.json({ error: "Добавьте товар." }, { status: 400 });
    const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
    if (products.length !== quantities.size) return NextResponse.json({ error: "Некоторые товары не найдены." }, { status: 409 });
    for (const p of products) {
      const q = quantities.get(p.id) ?? 0;
      if (q > p.stock) return NextResponse.json({ error: `Недостаточно «${p.name}». Остаток: ${p.stock}.` }, { status: 409 });
    }

    const total = products.reduce((sum, product) => sum + product.price * (quantities.get(product.id) ?? 0), 0);
    const paymentStatus = typeof body.paymentStatus === "string" ? body.paymentStatus : "PAID";
    if (!["PAID", "UNPAID", "PARTIAL", "CONSIGNMENT"].includes(paymentStatus)) return NextResponse.json({ error: "Некорректный тип оплаты." }, { status: 400 });
    let paidAmount = paymentStatus === "PAID" ? total : paymentStatus === "PARTIAL" ? Number(body.paidAmount) : 0;
    if (!Number.isFinite(paidAmount)) paidAmount = 0;
    paidAmount = Math.max(0, Math.min(total, paidAmount));
    if (paymentStatus === "PARTIAL" && (paidAmount <= 0 || paidAmount >= total)) return NextResponse.json({ error: "Для частичной оплаты укажите сумму больше 0 и меньше суммы заказа." }, { status: 400 });
    const debtIncrease = paymentStatus === "CONSIGNMENT" ? 0 : Math.max(0, total - paidAmount);
    const method = typeof body.paymentMethod === "string" ? body.paymentMethod.slice(0, 40) : "Наличные";

    const order = await prisma.$transaction(async (tx) => {
      for (const p of products) {
        const q = quantities.get(p.id) ?? 0;
        await tx.product.update({ where: { id: p.id }, data: { stock: { decrement: q } } });
        await tx.inventoryMovement.create({ data: { productId: p.id, userId: user.id, type: "FIELD_SALE", quantity: -q, note: `Продажа в магазине #${storeId}` } });
      }
      if (debtIncrease > 0) await tx.store.update({ where: { id: storeId }, data: { debt: { increment: debtIncrease } } });
      const created = await tx.order.create({
        data: {
          userId: user.id,
          storeId,
          status: "COMPLETED",
          paymentStatus,
          debtPosted: debtIncrease > 0,
          debtAmount: debtIncrease,
          comment: typeof body.comment === "string" ? body.comment.slice(0, 1000) : null,
          total,
          items: { create: products.map((p) => ({ productId: p.id, productName: p.name, article: p.article, price: p.price, purchasePrice: p.purchasePrice, quantity: quantities.get(p.id) ?? 1 })) },
        },
      });
      if (paidAmount > 0) {
        await tx.financeEntry.create({ data: { type: "INCOME", category: "Оплата магазина", amount: paidAmount, note: `Оплата по продаже №${created.id}`, entryDate: new Date(), orderId: created.id, storeId, paymentMethod: method, createdById: user.id } });
      }
      return created;
    });
    return NextResponse.json({ id: order.id, debtAdded: debtIncrease, paidAmount }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось оформить продажу." }, { status: 500 });
  }
}
