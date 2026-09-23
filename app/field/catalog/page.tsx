import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

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

  return (
    <div className="container-page max-w-6xl">
      <div>
        <p className="eyebrow">Каталог на планшете</p>
        <h1 className="mt-2 text-3xl font-semibold">Товар в наличии сейчас</h1>
        <p className="mt-2 text-zinc-500">
          Покажите ассортимент владельцу магазина и сразу назовите остаток.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const inCar = myMap.get(p.id) ?? 0;

          return (
            <article
              key={p.id}
              className="surface-card flex flex-col p-3"
            >
              <div className="grid grid-cols-[110px_1fr] gap-4">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  className="aspect-square w-full rounded-xl"
                />
                <div className="min-w-0 py-1">
                  <span className="text-xs text-violet-700">
                    {p.category.name}
                  </span>
                  <h2 className="mt-1 line-clamp-2 font-semibold">
                    {p.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {inCar > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        В наличии: {inCar} шт
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                        В машине нет
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      На складе: {p.stock} шт
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <strong>{formatCurrency(p.price)}</strong>
                    <span className="text-xs text-zinc-400">
                      Мин. {p.minOrder} шт.
                    </span>
                  </div>
                </div>
              </div>

              {inCar > 0 && (
                <Link
                  href={`/field/sell/${p.id}`}
                  className="mt-3 block rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Продать
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}