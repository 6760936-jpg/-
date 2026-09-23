import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { FieldCatalogClient } from "@/components/FieldCatalogClient";

export const dynamic = "force-dynamic";

export default async function FieldCatalogPage() {
  const user = await requireField();

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [{ stock: "desc" }, { name: "asc" }],
  });

  const myInventory = await prisma.driverInventory.findMany({
    where: { userId: user.id },
  });
  const myMap = new Map<number, number>();
  for (const row of myInventory) {
    myMap.set(row.productId, row.quantity);
  }

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    article: p.article,
    price: p.price,
    image: p.image,
    minOrder: p.minOrder,
    stock: p.stock,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    inCar: myMap.get(p.id) ?? 0,
  }));

  return (
    <div className="container-page max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow">Каталог на планшете</p>
        <h1 className="mt-2 text-3xl font-semibold">Товар в наличии сейчас</h1>
        <p className="mt-2 text-zinc-500">
          Выберите товары в корзину — в конце оформите продажу.
        </p>
      </div>

      <FieldCatalogClient products={data} categories={categories} />
    </div>
  );
}