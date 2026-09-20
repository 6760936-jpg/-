import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";

type RegisterInput = {
  name?: unknown; phone?: unknown; shopName?: unknown; address?: unknown; shelfCode?: unknown; password?: unknown;
  latitude?: unknown; longitude?: unknown;
};

function cleanText(value: unknown, maxLength: number): string { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }
function coordinate(value: unknown): number | null { const n = Number(value); return Number.isFinite(n) ? n : null; }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterInput;
    const name = cleanText(body.name, 100);
    const phone = normalizePhone(body.phone);
    const shopName = cleanText(body.shopName, 150);
    const address = cleanText(body.address, 250);
    const shelfCode = cleanText(body.shelfCode, 32).toUpperCase();
    const password = typeof body.password === "string" ? body.password : "";
    const latitude = coordinate(body.latitude);
    const longitude = coordinate(body.longitude);
    const passwordError = validatePassword(password);

    if (name.length < 2) return NextResponse.json({ error: "Укажите имя." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Укажите российский номер телефона." }, { status: 400 });
    if (shopName.length < 2) return NextResponse.json({ error: "Укажите название магазина." }, { status: 400 });
    if (address.length < 4) return NextResponse.json({ error: "Укажите адрес магазина." }, { status: 400 });
    if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return NextResponse.json({ error: "Укажите точку магазина на карте." }, { status: 400 });
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing?.passwordHash) return NextResponse.json({ error: "Аккаунт с таким телефоном уже существует." }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({ where: { id: existing.id }, data: { name, shopName, passwordHash, role: existing.role || "CUSTOMER", active: true } })
        : await tx.user.create({ data: { name, phone, shopName, passwordHash, role: "CUSTOMER" } });

      let storeId: number;
      let linkedByShelf = false;
      if (shelfCode) {
        const shelf = await tx.shelf.findUnique({ where: { code: shelfCode }, include: { store: true } });
        if (shelf?.store) {
          storeId = shelf.store.id;
          linkedByShelf = true;
          await tx.store.update({ where: { id: storeId }, data: { name: shopName, phone, address, latitude, longitude, status: "ACTIVE", needsReview: false } });
        } else {
          const store = await tx.store.create({ data: { name: shopName, phone, address, latitude, longitude, source: "SELF", status: "PENDING", needsReview: true, notes: `При регистрации указан номер полки: ${shelfCode}, совпадение не найдено.` } });
          storeId = store.id;
        }
      } else {
        const store = await tx.store.create({ data: { name: shopName, phone, address, latitude, longitude, source: "SELF", status: "PENDING", needsReview: true, notes: "Самостоятельная регистрация без номера полки." } });
        storeId = store.id;
      }

      await tx.storeMembership.upsert({ where: { userId_storeId: { userId: user.id, storeId } }, update: { active: true, role: "OWNER" }, create: { userId: user.id, storeId, role: "OWNER" } });
      return { user, linkedByShelf };
    });

    const session = await createSession(result.user.id);
    const response = NextResponse.json({ user: { id: result.user.id, name: result.user.name, phone: result.user.phone, shopName: result.user.shopName, role: result.user.role }, linkedByShelf: result.linkedByShelf }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expiresAt });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
