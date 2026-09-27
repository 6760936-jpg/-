import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.routeStop.deleteMany({});
  console.log(`Удалено routeStop: ${result.count}`);
  const routes = await prisma.deliveryRoute.findMany({ include: { stops: true } });
  console.log("Маршрутов:", routes.length);
  for (const r of routes) {
    console.log(`  №${r.id} "${r.title}": ${r.stops.length} точек`);
  }
}
main().finally(() => prisma.$disconnect());