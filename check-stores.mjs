import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.user.findFirst({ where: { name: "Шуайб" } });
  console.log("Пользователь:", driver?.name, "id=", driver?.id);

  const routes = await prisma.deliveryRoute.findMany({
    where: { assignedUserId: driver?.id },
    include: { stops: { include: { store: true } } },
  });
  console.log("Маршрутов у Шуайба:", routes.length);
  routes.forEach(r => {
    console.log(`  Маршрут "${r.title}" — точек: ${r.stops.length}`);
    r.stops.forEach(s => console.log(`    - ${s.store.name}`));
  });

  const allStores = await prisma.store.findMany({ take: 10 });
  console.log("Всего магазинов в базе:", allStores.length);
  allStores.forEach(s => console.log(`  - ${s.name} (${s.address})`));
}
main().finally(() => prisma.$disconnect());