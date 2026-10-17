import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Отчёты" };

export default async function ReportsPage() {
  await requireAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Заказы за месяц
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
    include: {
      items: true,
      user: true,
      store: true,
    },
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  // Лучшие товары (по сумме)
  const productMap = new Map<number, { name: string; qty: number; total: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId ?? 0;
      const existing = productMap.get(key) || { name: item.productName, qty: 0, total: 0 };
      existing.qty += item.quantity;
      existing.total += item.price * item.quantity;
      productMap.set(key, existing);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Лучшие магазины (по сумме)
  const storeMap = new Map<number, { name: string; orders: number; total: number }>();
  for (const order of orders) {
    const key = order.storeId ?? 0;
    const name = order.store?.name ?? order.user.shopName;
    const existing = storeMap.get(key) || { name, orders: 0, total: 0 };
    existing.orders += 1;
    existing.total += order.total;
    storeMap.set(key, existing);
  }
  const topStores = Array.from(storeMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Отчёты</h1>
          <p className="mt-2 text-zinc-500">
            За текущий месяц ({new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(now)})
          </p>
        </div>
        <Link href="/admin" className="button-secondary">← В обзор</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Всего заказов</span>
          <strong className="mt-2 block text-3xl">{orders.length}</strong>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Общая выручка</span>
          <strong className="mt-2 block text-3xl text-emerald-700">{formatCurrency(totalSales)}</strong>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Топ товаров */}
        <section className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 bg-zinc-50">
            <h2 className="font-semibold">Топ-10 товаров по выручке</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{i + 1}. {p.name}</p>
                  <p className="text-xs text-zinc-500">Продано: {p.qty} шт</p>
                </div>
                <strong>{formatCurrency(p.total)}</strong>
              </div>
            ))}
            {topProducts.length === 0 && <p className="p-4 text-sm text-zinc-500">Данных пока нет.</p>}
          </div>
        </section>

        {/* Топ магазинов */}
        <section className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 bg-zinc-50">
            <h2 className="font-semibold">Топ-10 магазинов по выручке</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {topStores.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{i + 1}. {s.name}</p>
                  <p className="text-xs text-zinc-500">Заказов: {s.orders}</p>
                </div>
                <strong>{formatCurrency(s.total)}</strong>
              </div>
            ))}
            {topStores.length === 0 && <p className="p-4 text-sm text-zinc-500">Данных пока нет.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}