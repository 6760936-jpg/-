import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const del = await p.user.deleteMany({ where: { phone: "+79990000001" } });
console.log("Удалено:", del.count);
await p.$disconnect();