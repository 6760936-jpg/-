import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  await prisma.user.upsert({
    where: { phone: "+79990000000" },
    update: { role: "ADMIN", passwordHash: hashPassword("admin123"), active: true },
    create: { name: "Главный Админ", phone: "+79990000000", role: "ADMIN", passwordHash: hashPassword("admin123"), active: true },
  });
  console.log("Админ создан! Логин: +79990000000, Пароль: admin123");
}
main().finally(() => prisma.$disconnect());