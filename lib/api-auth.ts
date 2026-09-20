import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function getApiUser() {
  const user = await getCurrentUser();
  return user ?? NextResponse.json({ error: "Требуется вход." }, { status: 401 });
}

export async function getApiRoles(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  if (!roles.includes(user.role)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  return user;
}

export async function getApiAdmin() {
  return getApiRoles(["DIRECTOR", "ADMIN"]);
}
