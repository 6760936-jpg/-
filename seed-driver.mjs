import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.user.findFirst({
    where: { name: "Шуайб" },
  });
  if (!driver) {
    console.log("Не найден Шуайб");
    return;
  }
  console.log(`Пользователь: ${driver.name} (id=${driver.id}, роль=${driver.role})`);

  const products = await prisma.product.findMany({ take: 5 });
  for (const p of products) {
    await prisma.driverInventory.upsert({
      where: { userId_productId: { userId: driver.id, productId: p.id } },
      update: { quantity: 10 },
      create: { userId: driver.id, productId: p.id, quantity: 10 },
    });
    console.log(`  + ${p.name}: 10 шт`);
  }
  console.log("Готово!");
}
main().finally(() => prisma.$disconnect());