import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany({
    where: { routeLineId: { not: null } },
    include: {
      routeLine: true,
      routeStops: { include: { route: true } },
    },
    orderBy: { id: "asc" },
  });
  console.log("=== МАГАЗИНЫ С ЛИНИЕЙ ===");
  for (const s of stores) {
    const routes = s.routeStops.map((rs) => rs.route.title).join(", ");
    console.log(`\n${s.name}`);
    console.log(`  Линия: ${s.routeLine?.title ?? "нет"}`);
    console.log(`  НП: ${s.settlement ?? "нет"}`);
    console.log(`  В маршрутах: ${routes || "нет"}`);
  }
}
main().finally(() => prisma.$disconnect());