import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Операционный центр" };

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    products,
    stores,
    shelvesCount,
    complaints,
    todayOrders,
    monthOrders,
    monthFinance,
    spoilage,
    activeRoutes,
    inProgressRoutes,
  ] = await Promise.all([
    prisma.product.findMany(),
    prisma.store.findMany({ orderBy: { debt: "desc" } }),
    prisma.shelf.count({ where: { status: "INSTALLED" } }),
    prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart, lt: tomorrowStart }, status: { not: "CANCELLED" } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.financeEntry.findMany({ where: { entryDate: { gte: monthStart } } }),
    prisma.spoilage.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.deliveryRoute.findMany({ where: { routeDate: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.deliveryRoute.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const monthSales = monthOrders.reduce((s, o) => s + o.total, 0);
  const income = monthFinance.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const expenses = monthFinance.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  const totalDebt = stores.reduce((s, store) => s + store.debt, 0);

  const expenseMap = new Map<string, number>();
  for (const entry of monthFinance.filter((e) => e.type === "EXPENSE")) {
    expenseMap.set(entry.category, (expenseMap.get(entry.category) ?? 0) + entry.amount);
  }
  const expenseByCategory = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);
  const debtors = stores.filter((s) => s.debt > 0).slice(0, 6);
  const lowStock = products.filter((p) => p.active && p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6);

  const isDirector = user.role === "DIRECTOR";

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Продажи сегодня</span>
          <strong className="mt-2 block text-3xl text-emerald-700">{formatCurrency(todaySales)}</strong>
          <p className="mt-1 text-xs text-zinc-400">Заказов: {todayOrders.length}</p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Заказы сегодня</span>
          <strong className="mt-2 block text-3xl">{todayOrders.length}</strong>
          <p className="mt-1 text-xs text-zinc-400">Всего в работе: {monthOrders.length}</p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Маршрутов сегодня</span>
          <strong className="mt-2 block text-3xl">{activeRoutes.length}</strong>
          <p className="mt-1 text-xs text-zinc-400">В работе: {inProgressRoutes}</p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Долги магазинов</span>
          <strong className={`mt-2 block text-3xl ${totalDebt > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {formatCurrency(totalDebt)}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">Должников: {stores.filter((s) => s.debt > 0).length}</p>
        </div>
      </div>

      {isDirector && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Продажи за месяц</span><strong className="mt-2 block text-2xl">{formatCurrency(monthSales)}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Получено денег</span><strong className="mt-2 block text-2xl text-emerald-700">{formatCurrency(income)}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Расходы</span><strong className="mt-2 block text-2xl text-rose-700">{formatCurrency(expenses)}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Результат</span><strong className="mt-2 block text-2xl">{formatCurrency(income - expenses)}</strong></div>
        </div>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">⚠ Проблемы с остатками</h2>
            <Link href="/admin/products" className="text-xs font-semibold text-violet-700">Все товары →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}/edit`} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm hover:text-violet-700">
                <span className="truncate">{p.name}</span>
                <span className={`shrink-0 font-semibold ${p.stock === 0 ? "text-rose-700" : "text-amber-700"}`}>{p.stock} шт</span>
              </Link>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-zinc-500">Все остатки в норме.</p>}
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Крупнейшие долги магазинов</h2>
            <Link href="/admin/stores" className="text-xs font-semibold text-violet-700">Все магазины →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {debtors.map((store) => (
              <Link key={store.id} href={`/admin/stores/${store.id}`} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm hover:text-violet-700">
                <span className="truncate">{store.name}</span>
                <strong className="shrink-0 text-rose-700">{formatCurrency(store.debt)}</strong>
              </Link>
            ))}
            {debtors.length === 0 && <p className="text-sm text-zinc-500">Долгов нет.</p>}
          </div>
        </section>
      </div>

      {isDirector && expenseByCategory.length > 0 && (
        <section className="surface-card mt-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Расходы за месяц по статьям</h2>
            <Link href="/admin/finance" className="text-xs font-semibold text-violet-700">Все финансы →</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {expenseByCategory.slice(0, 8).map(([category, amount]) => (
              <div key={category} className="rounded-xl border border-zinc-100 p-3">
                <span className="block text-xs text-zinc-500">{category}</span>
                <strong className="mt-1 block text-rose-700">{formatCurrency(amount)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Товаров</span><strong className="mt-2 block text-2xl">{products.length}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Установлено полок</span><strong className="mt-2 block text-2xl">{shelvesCount}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Порча за месяц</span><strong className="mt-2 block text-2xl">{formatCurrency(spoilage._sum.amount ?? 0)}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Нерешённые жалобы</span><strong className="mt-2 block text-2xl">{complaints}</strong></div>
      </div>
    </div>
  );
}