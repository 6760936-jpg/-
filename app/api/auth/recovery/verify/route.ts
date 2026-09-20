import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { formatPhone, normalizePhone } from "@/lib/phone";
import {
  createResetToken,
  hashResetToken,
  RESET_MAX_ATTEMPTS,
} from "@/lib/password-recovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown; code?: unknown };
    const phone = normalizePhone(body.phone);
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!phone || code.length !== 6) {
      return NextResponse.json({ error: "Введите номер телефона и шестизначный код." }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({ where: { phone } });
    const unavailable =
      !reset ||
      reset.usedAt !== null ||
      reset.expiresAt <= new Date() ||
      reset.attempts >= RESET_MAX_ATTEMPTS;

    if (unavailable) {
      return NextResponse.json(
        { error: "Код недействителен или срок его действия истёк. Запросите новый код." },
        { status: 400 },
      );
    }

    const nextAttempts = reset.attempts + 1;
    const codeIsValid = await verifyPassword(code, reset.codeHash);

    if (!codeIsValid) {
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { attempts: nextAttempts },
      });

      const attemptsLeft = Math.max(0, RESET_MAX_ATTEMPTS - nextAttempts);
      return NextResponse.json(
        {
          error:
            attemptsLeft > 0
              ? `Неверный код. Осталось попыток: ${attemptsLeft}.`
              : "Превышено количество попыток. Запросите новый код.",
        },
        { status: 400 },
      );
    }

    const resetToken = createResetToken();
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: {
        attempts: nextAttempts,
        verifiedAt: new Date(),
        resetTokenHash: hashResetToken(resetToken),
      },
    });

    return NextResponse.json({
      resetToken,
      login: formatPhone(phone),
      message: "Номер подтверждён. Теперь установите новый пароль.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось проверить код." }, { status: 500 });
  }
}
