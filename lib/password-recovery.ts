import { createHash, randomBytes, randomInt } from "crypto";

export const RESET_CODE_TTL_MINUTES = 10;
export const RESET_RESEND_SECONDS = 60;
export const RESET_MAX_ATTEMPTS = 5;

export function createResetCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function createResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetCodeExpiresAt(): Date {
  return new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);
}

export function secondsUntilResend(lastSentAt: Date): number {
  const elapsedSeconds = Math.floor((Date.now() - lastSentAt.getTime()) / 1000);
  return Math.max(0, RESET_RESEND_SECONDS - elapsedSeconds);
}
