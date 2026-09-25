import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (user instanceof NextResponse) return user;

  try {
    const body = (await request.json()) as {
      type?: string;
      title?: string;
      description?: string;
    };

    const type = body.type === "SUGGESTION" ? "SUGGESTION" : "COMPLAINT";
    const title = (body.title ?? "").trim().slice(0, 200);
    const description = (body.description ?? "").trim().slice(0, 2000);

    if (title.length < 3 || description.length < 5) {
      return NextResponse.json(
        { error: "Заполните тему и описание" },
        { status: 400 },
      );
    }

    const membership = await prisma.storeMembership.findFirst({
      where: { userId: user.id, active: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "У вас нет привязанного магазина" },
        { status: 403 },
      );
    }

    const feedback = await prisma.complaint.create({
      data: {
        storeId: membership.storeId,
        type,
        title,
        description,
        status: "NEW",
        createdById: user.id,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось отправить обращение" },
      { status: 500 },
    );
  }
}