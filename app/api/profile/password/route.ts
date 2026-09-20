import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

type PasswordInput = {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

export async function POST(request: Request) {
  try {
    const sessionUser = await getApiUser();
    if (sessionUser instanceof NextResponse) return sessionUser;

    const body = (await request.json()) as PasswordInput;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword) {
      return NextResponse.json({ error: "Введите текущий пароль." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Новые пароли не совпадают." }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Новый пароль должен отличаться от текущего." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user?.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Текущий пароль указан неверно." }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    const response = NextResponse.json({ message: "Пароль успешно изменён. Войдите заново с новым паролем.", reauth: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось изменить пароль." }, { status: 500 });
  }
}
