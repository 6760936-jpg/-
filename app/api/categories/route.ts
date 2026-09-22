import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(categories);
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

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim().slice(0, 120);
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Укажите название категории" },
        { status: 400 },
      );
    }

    let slug = slugify(name);
    const used = await prisma.category.findUnique({ where: { slug } });
    if (used) slug = `${slug}-${Date.now().toString().slice(-5)}`;

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось создать категорию";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}