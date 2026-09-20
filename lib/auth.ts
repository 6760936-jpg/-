import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "aromaline_session";
const SESSION_DAYS = 30;

export type UserRole = "DIRECTOR" | "ADMIN" | "FIELD" | "DRIVER" | "WAREHOUSE" | "MANAGER" | "CUSTOMER" | "SUPPLIER";

export type AuthUser = {
  id: number;
  name: string;
  phone: string;
  shopName: string;
  role: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, phone: true, shopName: true, role: true, active: true } } },
  });
  if (!session || !session.user.active) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function requireUser(nextPath = "/profile"): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireRoles(roles: string[], nextPath = "/admin"): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!roles.includes(user.role)) redirect(["FIELD", "DRIVER"].includes(user.role) ? "/field" : "/profile");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRoles(["DIRECTOR", "ADMIN"], "/admin");
}

export async function requireManagement(): Promise<AuthUser> {
  return requireRoles(["DIRECTOR", "ADMIN", "MANAGER", "WAREHOUSE"], "/admin");
}

export async function requireField(): Promise<AuthUser> {
  return requireRoles(["DIRECTOR", "ADMIN", "FIELD", "DRIVER"], "/field");
}

export function canSeeFinance(role: string): boolean {
  return role === "DIRECTOR";
}
