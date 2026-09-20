import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/product-validation";
import { getApiAdmin } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный идентификатор товара." }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await getApiAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный идентификатор товара." }, { status: 400 });

  try {
    const validation = validateProductInput(await request.json());
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Проверьте заполненные поля.", details: validation.errors },
        { status: 400 },
      );
    }

    const [existing, category] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.category.findUnique({ where: { id: validation.data.categoryId } }),
    ]);
    if (!existing) return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
    if (!category) {
      return NextResponse.json(
        { error: "Выбранная категория не существует.", details: { categoryId: "Категория не найдена." } },
        { status: 400 },
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Товар с таким артикулом уже существует.", details: { article: "Артикул должен быть уникальным." } },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка при изменении товара." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getApiAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный идентификатор товара." }, { status: 400 });

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка при удалении товара." }, { status: 500 });
  }
}
