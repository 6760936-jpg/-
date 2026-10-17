import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getApiAdmin();
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const type = body.type === "INCOME" ? "INCOME" : "EXPENSE";

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Укажите товар и количество" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    if (type === "EXPENSE" && product.stock < quantity) {
      return NextResponse.json({ error: `На складе только ${product.stock} шт.` }, { status: 400 });
    }

    const delta = type === "INCOME" ? quantity : -quantity;

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      }),
      prisma.inventoryMovement.create({
        data: {
          productId,
          userId: user.id,
          type,
          quantity: delta,
          note: type === "INCOME" ? "Приход от поставщика" : "Расход со склада",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}