import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown; password?: unknown };
    const phone = normalizePhone(body.phone);
    const password = typeof body.password === "string" ? body.password : "";

    if (!phone || !password) {
      return NextResponse.json({ error: "Введите телефон и пароль." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Неверный телефон или пароль." }, { status: 401 });
    }

    await prisma.session.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });
    const session = await createSession(user.id);
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, shopName: user.shopName, role: user.role },
    });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось выполнить вход." }, { status: 500 });
  }
}
