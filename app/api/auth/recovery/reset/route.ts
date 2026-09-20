import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { formatPhone } from "@/lib/phone";
import { hashResetToken } from "@/lib/password-recovery";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      resetToken?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };

    const resetToken = typeof body.resetToken === "string" ? body.resetToken : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!resetToken) {
      return NextResponse.json({ error: "Сначала подтвердите номер телефона." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Новые пароли не совпадают." }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { resetTokenHash: hashResetToken(resetToken) },
    });

    if (!reset || !reset.verifiedAt || reset.usedAt || reset.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Ссылка восстановления недействительна. Запросите новый код." },
        { status: 400 },
      );
    }

    if (reset.userId) {
      const passwordHash = await hashPassword(newPassword);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: reset.userId },
          data: { passwordHash },
        }),
        prisma.session.deleteMany({ where: { userId: reset.userId } }),
        prisma.passwordReset.update({
          where: { id: reset.id },
          data: { usedAt: new Date(), resetTokenHash: null },
        }),
      ]);
    } else {
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date(), resetTokenHash: null },
      });
    }

    const response = NextResponse.json({
      message: "Доступ восстановлен. Войдите по номеру телефона с новым паролем.",
      login: formatPhone(reset.phone),
    });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось изменить пароль." }, { status: 500 });
  }
}
