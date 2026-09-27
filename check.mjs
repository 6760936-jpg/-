import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const routes = await prisma.deliveryRoute.findMany({
    include: { stops: true, assignedUser: true },
    orderBy: { id: "asc" },
  });
  console.log("=== МАРШРУТЫ В БАЗЕ ===");
  for (const r of routes) {
    console.log(`№${r.id} | ${r.title} | точек: ${r.stops.length} | водитель: ${r.assignedUser?.name ?? "нет"}`);
  }
}
main().finally(() => prisma.$disconnect());