import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.routeStop.count();
  console.log("Всего routeStop:", count);
  const stops = await prisma.routeStop.findMany({
    include: { route: true, store: true },
  });
  for (const s of stops) {
    console.log(`  ${s.route.title} → ${s.store.name}`);
  }
}
main().finally(() => prisma.$disconnect());