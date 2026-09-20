import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import {
  createResetCode,
  resetCodeExpiresAt,
  secondsUntilResend,
} from "@/lib/password-recovery";
import { sendPasswordResetCode } from "@/lib/sms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown };
    const phone = normalizePhone(body.phone);

    if (!phone) {
      return NextResponse.json({ error: "Укажите российский номер телефона." }, { status: 400 });
    }

    const existingReset = await prisma.passwordReset.findUnique({ where: { phone } });
    if (existingReset) {
      const retryAfter = secondsUntilResend(existingReset.lastSentAt);
      if (retryAfter > 0) {
        return NextResponse.json(
          { error: `Повторный код можно запросить через ${retryAfter} сек.`, retryAfter },
          { status: 429 },
        );
      }
    }

    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    const code = createResetCode();
    const codeHash = await hashPassword(code);
    const now = new Date();

    await prisma.passwordReset.upsert({
      where: { phone },
      create: {
        phone,
        userId: user?.id ?? null,
        codeHash,
        expiresAt: resetCodeExpiresAt(),
        lastSentAt: now,
      },
      update: {
        userId: user?.id ?? null,
        codeHash,
        resetTokenHash: null,
        expiresAt: resetCodeExpiresAt(),
        verifiedAt: null,
        usedAt: null,
        attempts: 0,
        lastSentAt: now,
      },
    });

    await sendPasswordResetCode(phone, code);

    return NextResponse.json({
      message: "Если аккаунт существует, код восстановления отправлен на указанный номер.",
      retryAfter: 60,
      ...(process.env.NODE_ENV !== "production" ? { testCode: code } : {}),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось отправить код восстановления." }, { status: 500 });
  }
}
