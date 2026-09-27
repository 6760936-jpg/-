import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const routes = await prisma.deliveryRoute.findMany({
    include: { stops: { include: { store: true } } },
    orderBy: { id: "asc" },
  });
  console.log("=== ТОЧКИ В МАРШРУТАХ ===");
  for (const r of routes) {
    console.log(`\nМаршрут №${r.id} "${r.title}"`);
    for (const s of r.stops) {
      console.log(`  ${s.sequence}. ${s.store.name}`);
    }
  }
}
main().finally(() => prisma.$disconnect());