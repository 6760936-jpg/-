import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "ПЕРСПЕКТИВА — управление" };

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    products,
    stores,
    shelvesCount,
    complaints,
    recentOrders,
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
      include: { user: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lt: tomorrowStart },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.financeEntry.findMany({
      where: { entryDate: { gte: monthStart } },
    }),
    prisma.spoilage.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.deliveryRoute.findMany({
      where: { routeDate: { gte: todayStart, lt: tomorrowStart } },
      include: { stops: true },
    }),
    prisma.deliveryRoute.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const monthSales = monthOrders.reduce((s, o) => s + o.total, 0);
  const income = monthFinance
    .filter((e) => e.type === "INCOME")
    .reduce((s, e) => s + e.amount, 0);
  const expenses = monthFinance
    .filter((e) => e.type === "EXPENSE")
    .reduce((s, e) => s + e.amount, 0);
  const totalDebt = stores.reduce((s, store) => s + store.debt, 0);

  const expenseMap = new Map<string, number>();
  for (const entry of monthFinance.filter((e) => e.type === "EXPENSE")) {
    expenseMap.set(
      entry.category,
      (expenseMap.get(entry.category) ?? 0) + entry.amount,
    );
  }
  const expenseByCategory = Array.from(expenseMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  const debtors = stores.filter((s) => s.debt > 0).slice(0, 6);
  const stockValue = products.reduce(
    (s, p) => s + p.purchasePrice * p.stock,
    0,
  );

  // Проблемы с остатками — где stock <= 5
  const lowStock = products
    .filter((p) => p.active && p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const isDirector = user.role === "DIRECTOR";

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            {isDirector ? "Кабинет генерального директора" : "Администрирование"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Операционный центр
          </h1>
          <p className="mt-2 text-zinc-500">
            Быстрый контроль состояния компании.
          </p>
        </div>
        <Link href="/field" className="button-secondary">
          Рабочий кабинет / карта
        </Link>
      </div>

      {/* KPI за сегодня */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Продажи сегодня</span>
          <strong className="mt-2 block text-3xl text-emerald-700">
            {formatCurrency(todaySales)}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">
            Заказов: {todayOrders.length}
          </p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Заказы сегодня</span>
          <strong className="mt-2 block text-3xl">
            {todayOrders.length}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">
            Всего в работе: {monthOrders.length}
          </p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Маршрутов сегодня</span>
          <strong className="mt-2 block text-3xl">{activeRoutes.length}</strong>
          <p className="mt-1 text-xs text-zinc-400">
            В работе: {inProgressRoutes}
          </p>
        </div>
        <div className="surface-card p-5">
          <span className="text-sm text-zinc-500">Долги магазинов</span>
          <strong
            className={`mt-2 block text-3xl ${
              totalDebt > 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {formatCurrency(totalDebt)}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">
            Должников: {stores.filter((s) => s.debt > 0).length}
          </p>
        </div>
      </div>

      {/* KPI для директора */}
      {isDirector && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-5">
            <span className="text-sm text-zinc-500">Продажи за месяц</span>
            <strong className="mt-2 block text-2xl">
              {formatCurrency(monthSales)}
            </strong>
          </div>
          <div className="surface-card p-5">
            <span className="text-sm text-zinc-500">Получено денег</span>
            <strong className="mt-2 block text-2xl text-emerald-700">
              {formatCurrency(income)}
            </strong>
          </div>
          <div className="surface-card p-5">
            <span className="text-sm text-zinc-500">Расходы</span>
            <strong className="mt-2 block text-2xl text-rose-700">
              {formatCurrency(expenses)}
            </strong>
          </div>
          <div className="surface-card p-5">
            <span className="text-sm text-zinc-500">Результат</span>
            <strong className="mt-2 block text-2xl">
              {formatCurrency(income - expenses)}
            </strong>
          </div>
        </div>
      )}

      {/* Проблемы с остатками + Долги */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">⚠ Проблемы с остатками</h2>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-violet-700"
            >
              Все товары →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm hover:text-violet-700"
              >
                <span className="truncate">{p.name}</span>
                <span
                  className={`shrink-0 font-semibold ${
                    p.stock === 0 ? "text-rose-700" : "text-amber-700"
                  }`}
                >
                  {p.stock} шт
                </span>
              </Link>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-zinc-500">
                Все остатки в норме.
              </p>
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Крупнейшие долги магазинов</h2>
            <Link
              href="/admin/stores"
              className="text-xs font-semibold text-violet-700"
            >
              Все магазины →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {debtors.map((store) => (
              <Link
                key={store.id}
                href={`/admin/stores/${store.id}`}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm hover:text-violet-700"
              >
                <span className="truncate">{store.name}</span>
                <strong className="shrink-0 text-rose-700">
                  {formatCurrency(store.debt)}
                </strong>
              </Link>
            ))}
            {debtors.length === 0 && (
              <p className="text-sm text-zinc-500">Долгов нет.</p>
            )}
          </div>
        </section>
      </div>

      {/* Расходы по статьям (только директор) */}
      {isDirector && expenseByCategory.length > 0 && (
        <section className="surface-card mt-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Расходы за месяц по статьям</h2>
            <Link
              href="/admin/finance"
              className="text-xs font-semibold text-violet-700"
            >
              Все финансы →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {expenseByCategory.slice(0, 8).map(([category, amount]) => (
              <div
                key={category}
                className="rounded-xl border border-zinc-100 p-3"
              >
                <span className="block text-xs text-zinc-500">
                  {category}
                </span>
                <strong className="mt-1 block text-rose-700">
                  {formatCurrency(amount)}
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Общие счётчики */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Товаров</span>
          <strong className="mt-2 block text-2xl">{products.length}</strong>
        </div>
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Установлено полок</span>
          <strong className="mt-2 block text-2xl">{shelvesCount}</strong>
        </div>
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Порча за месяц</span>
          <strong className="mt-2 block text-2xl">
            {formatCurrency(spoilage._sum.amount ?? 0)}
          </strong>
        </div>
        <div className="surface-card p-4">
          <span className="text-sm text-zinc-500">Нерешённые жалобы</span>
          <strong className="mt-2 block text-2xl">{complaints}</strong>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 p-5">
            <div>
              <h2 className="font-semibold">Последние заказы</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Новые и текущие поставки
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-violet-700"
              href="/admin/orders"
            >
              Все заказы →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid gap-2 p-5 sm:grid-cols-[80px_1fr_auto] sm:items-center"
              >
                <span className="text-sm font-semibold">№{order.id}</span>
                <div>
                  <strong className="block text-sm">
                    {order.store?.name ?? order.user.shopName}
                  </strong>
                  <span className="text-xs text-zinc-500">
                    {order.user.name} ·{" "}
                    {new Intl.DateTimeFormat("ru-RU").format(order.createdAt)}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <strong className="block text-sm">
                    {formatCurrency(order.total)}
                  </strong>
                  <span className="text-xs text-zinc-500">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="p-8 text-center text-zinc-500">
                Заказов пока нет.
              </p>
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-semibold">Быстрые действия</h2>
          <div className="mt-4 grid gap-3">
            <Link
              href="/admin/products/new"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50"
            >
              Добавить товар →
            </Link>
            <Link
              href="/admin/stores"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50"
            >
              Магазины и долги →
            </Link>
            <Link
              href="/admin/routes"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50"
            >
              Линии и маршруты →
            </Link>
            {isDirector && (
              <Link
                href="/admin/finance"
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50"
              >
                Финансы →
              </Link>
            )}
            <Link
              href="/admin/complaints"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50"
            >
              Предложения и жалобы →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}