import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
const p = new PrismaClient();
const salt = randomBytes(16).toString("hex");
const hash = scryptSync("admin123", salt, 64).toString("hex");
const passwordHash = `scrypt$${salt}$${hash}`;
const u = await p.user.update({
  where: { phone: "+79990000000" },
  data: { passwordHash, role: "ADMIN", active: true },
});
console.log("Обновлён:", u.phone, "hash начинается с", u.passwordHash.slice(0, 7));
await p.$disconnect();