import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { sellFromVehicleAction } from "@/lib/field-actions";

export const dynamic = "force-dynamic";

export default async function FieldSellPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireField();
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });
  if (!product) notFound();

  const inventory = await prisma.driverInventory.findUnique({
    where: {
      userId_productId: { userId: user.id, productId: product.id },
    },
  });
  const inCar = inventory?.quantity ?? 0;

  // ВСЕ активные магазины
  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="container-page max-w-3xl">
      <Link
        href="/field/catalog"
        className="text-sm font-semibold text-violet-700 hover:text-violet-900"
      >
        ← Назад в каталог
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">Продажа товара</h1>

      <div className="mt-8 surface-card p-6">
        <div className="flex gap-5">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="h-28 w-28 rounded-xl"
          />
          <div>
            <span className="text-xs text-violet-700">
              {product.category.name}
            </span>
            <h2 className="mt-1 text-xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {formatCurrency(product.price)} · В машине: {inCar} шт
            </p>
          </div>
        </div>

        <form action={sellFromVehicleAction} className="mt-6 space-y-5">
          <input type="hidden" name="productId" value={product.id} />

          <label className="block">
            <span className="field-label">Магазин</span>
            <select name="storeId" className="input" required defaultValue="">
              <option value="" disabled>
                Выберите магазин
              </option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.address}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Количество</span>
            <input
              type="number"
              name="quantity"
              className="input"
              min={1}
              max={inCar}
              defaultValue={1}
              required
            />
          </label>

          <label className="block">
            <span className="field-label">Способ оплаты</span>
            <select name="paymentMethod" className="input">
              <option value="CASH">Наличные</option>
              <option value="CARD">Карта</option>
              <option value="DEBT">В долг</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Комментарий</span>
            <textarea name="note" className="input min-h-24" />
          </label>

          <div className="flex gap-3 border-t border-zinc-100 pt-5">
            <button className="button-primary">Продать</button>
            <Link href="/field/catalog" className="button-secondary">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}