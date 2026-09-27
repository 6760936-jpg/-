import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, latitude: true, longitude: true, routeLineId: true },
    orderBy: { id: "asc" },
  });
  console.log("Всего магазинов:", stores.length);
  stores.forEach((s) =>
    console.log(
      `  id=${s.id} | ${s.name} | lat=${s.latitude ?? "нет"} | lng=${s.longitude ?? "нет"} | линия=${s.routeLineId ?? "нет"}`,
    ),
  );
}
main().finally(() => prisma.$disconnect());