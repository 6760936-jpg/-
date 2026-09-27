import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const routes = await prisma.deliveryRoute.findMany({
    include: { stops: { include: { store: true } } },
  });
  console.log("Маршрутов:", routes.length);
  for (const r of routes) {
    console.log(`\nМаршрут №${r.id} "${r.title}"`);
    console.log(`  Точек: ${r.stops.length}`);
    for (const s of r.stops) {
      console.log(`    - ${s.store.name}`);
    }
  }
}
main().finally(() => prisma.$disconnect());