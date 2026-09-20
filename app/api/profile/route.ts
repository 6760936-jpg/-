import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ProfileInput = { name?: unknown; shopName?: unknown; phone?: unknown; address?: unknown; latitude?: unknown; longitude?: unknown };
function cleanText(value: unknown, maxLength: number): string { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }
function coord(value: unknown): number | null { const n=Number(value); return Number.isFinite(n)?n:null; }

export async function PATCH(request: Request) {
  try {
    const user = await getApiUser(); if (user instanceof NextResponse) return user;
    const body = (await request.json()) as ProfileInput;
    const name = cleanText(body.name, 100); const shopName = cleanText(body.shopName, 150); const phone = normalizePhone(body.phone);
    if (name.length < 2) return NextResponse.json({ error: "Укажите имя." }, { status: 400 });
    if (shopName.length < 2) return NextResponse.json({ error: "Укажите название магазина." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Укажите российский номер телефона." }, { status: 400 });
    if (phone !== user.phone && await prisma.user.findUnique({ where: { phone } })) return NextResponse.json({ error: "Этот номер уже используется другим аккаунтом." }, { status: 409 });

    const membership = await prisma.storeMembership.findFirst({ where: { userId: user.id, active: true }, orderBy: { createdAt: "asc" } });
    const address = cleanText(body.address, 250); const latitude = coord(body.latitude); const longitude = coord(body.longitude);
    if (membership) {
      if (address.length < 4) return NextResponse.json({ error: "Укажите адрес магазина." }, { status: 400 });
      if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return NextResponse.json({ error: "Укажите точку магазина на карте." }, { status: 400 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: user.id }, data: { name, shopName, phone }, select: { id: true, name: true, phone: true, shopName: true, role: true } });
      if (membership) await tx.store.update({ where: { id: membership.storeId }, data: { name: shopName, phone, address, latitude, longitude } });
      return updated;
    });
    return NextResponse.json({ user: updatedUser, message: "Данные профиля и магазина сохранены." });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Не удалось сохранить данные профиля." }, { status: 500 }); }
}
