import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/product-validation";
import { getApiAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const admin = await getApiAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const validation = validateProductInput(await request.json());
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Проверьте заполненные поля.", details: validation.errors },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: validation.data.categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Выбранная категория не существует.", details: { categoryId: "Категория не найдена." } },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: validation.data,
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Товар с таким артикулом уже существует.", details: { article: "Артикул должен быть уникальным." } },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка при создании товара." }, { status: 500 });
  }
}
