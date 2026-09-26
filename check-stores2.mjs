import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, address: true, routeLineId: true },
    orderBy: { id: "asc" },
    take: 20,
  });
  console.log("Всего магазинов:", await prisma.store.count());
  console.log("");
  stores.forEach((s) =>
    console.log(`  id=${s.id} | ${s.name} | ${s.address} | линия=${s.routeLineId ?? "нет"}`),
  );
}
main().finally(() => prisma.$disconnect());