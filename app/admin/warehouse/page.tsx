import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Склад" };

export default async function WarehousePage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" },
  });

  const movements = await prisma.inventoryMovement.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const totalStockValue = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0,
  );
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Склад</h1>
        <Link href="/admin/products" className="button-secondary">
          Управление товарами →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Стоимость остатков</span>
          <strong className="mt-2 block text-2xl">
            {formatCurrency(totalStockValue)}
          </strong>
        </div>
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Мало на складе (≤ 5)</span>
          <strong className="mt-2 block text-2xl text-amber-600">
            {lowStock}
          </strong>
        </div>
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Нет в наличии (0)</span>
          <strong className="mt-2 block text-2xl text-rose-600">
            {outOfStock}
          </strong>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 bg-zinc-50">
            <h2 className="font-semibold">Остатки на складе</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-100">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.article}</p>
                </div>
                <div className="text-right">
                  <strong className={p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : "text-emerald-600"}>
                    {p.stock} шт
                  </strong>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="p-4 text-sm text-zinc-500">Товаров нет.</p>}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 bg-zinc-50">
            <h2 className="font-semibold">История движения</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-100">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{m.product.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(m.createdAt)} · {m.user?.name ?? "Система"}
                  </p>
                  {m.note && <p className="mt-1 text-xs text-zinc-400">{m.note}</p>}
                </div>
                <div className={`text-right font-semibold ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity} шт
                  <p className="text-xs font-normal text-zinc-500">{m.type}</p>
                </div>
              </div>
            ))}
            {movements.length === 0 && <p className="p-4 text-sm text-zinc-500">Движений пока нет.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}