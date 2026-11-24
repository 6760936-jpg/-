import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
const p = new PrismaClient();
const salt = randomBytes(16).toString("hex");
const hash = scryptSync("director123", salt, 64).toString("hex");
const passwordHash = `scrypt$${salt}$${hash}`;
const u = await p.user.upsert({
  where: { phone: "+79638722222" },
  update: { role: "DIRECTOR", passwordHash, active: true },
  create: { name: "Генеральный директор", phone: "+79638722222", role: "DIRECTOR", passwordHash, active: true },
});
console.log("Директор готов:", u.phone, u.role);
await p.$disconnect();