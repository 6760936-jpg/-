import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "ПЕРСПЕКТИВА — управление" };

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [products, stores, shelves, complaints, recentOrders, monthOrders, monthFinance, spoilage] = await Promise.all([
    prisma.product.findMany(),
    prisma.store.findMany({ orderBy: { debt: "desc" } }),
    prisma.shelf.count({ where: { status: "INSTALLED" } }),
    prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.order.findMany({ include: { user: true, store: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.order.findMany({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.financeEntry.findMany({ where: { entryDate: { gte: monthStart } } }),
    prisma.spoilage.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } }),
  ]);
  const monthSales = monthOrders.reduce((sum, order) => sum + order.total, 0);
  const income = monthFinance.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = monthFinance.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + entry.amount, 0);
  const totalDebt = stores.reduce((sum, store) => sum + store.debt, 0);
  const expenseMap = new Map<string, number>();
  for (const entry of monthFinance.filter((entry) => entry.type === "EXPENSE")) expenseMap.set(entry.category, (expenseMap.get(entry.category) ?? 0) + entry.amount);
  const expenseByCategory = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);
  const debtors = stores.filter((store) => store.debt > 0).slice(0, 6);
  const stockValue = products.reduce((sum, product) => sum + product.purchasePrice * product.stock, 0);
  const isDirector = user.role === "DIRECTOR";

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">{isDirector ? "Кабинет генерального директора" : "Администрирование"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Добро пожаловать, {user.name}</h1><p className="mt-2 text-zinc-500">ПЕРСПЕКТИВА — продажи, магазины, доставка и внутреннее управление.</p></div>
        <Link href="/field" className="button-secondary">Рабочий кабинет / карта</Link>
      </div>

      {isDirector ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="surface-card p-5"><span className="text-sm text-zinc-500">Продажи за месяц</span><strong className="mt-2 block text-3xl">{formatCurrency(monthSales)}</strong></div>
            <div className="surface-card p-5"><span className="text-sm text-zinc-500">Получено денег</span><strong className="mt-2 block text-3xl text-emerald-700">{formatCurrency(income)}</strong></div>
            <div className="surface-card p-5"><span className="text-sm text-zinc-500">Расходы</span><strong className="mt-2 block text-3xl text-rose-700">{formatCurrency(expenses)}</strong></div>
            <div className="surface-card p-5"><span className="text-sm text-zinc-500">Результат по деньгам</span><strong className="mt-2 block text-3xl">{formatCurrency(income - expenses)}</strong></div>
            <div className="surface-card p-5"><span className="text-sm text-zinc-500">Долги магазинов</span><strong className={`mt-2 block text-3xl ${totalDebt > 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatCurrency(totalDebt)}</strong></div>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <section className="surface-card p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Расходы за месяц по статьям</h2><Link href="/admin/finance" className="text-xs font-semibold text-violet-700">Все финансы →</Link></div>
              <div className="mt-4 space-y-3">{expenseByCategory.slice(0, 7).map(([category, amount]) => <div key={category} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm"><span>{category}</span><strong className="text-rose-700">{formatCurrency(amount)}</strong></div>)}{expenseByCategory.length === 0 && <p className="text-sm text-zinc-500">За этот месяц расходы ещё не внесены.</p>}</div>
            </section>
            <section className="surface-card p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Крупнейшие долги магазинов</h2><Link href="/admin/finance" className="text-xs font-semibold text-violet-700">Все долги →</Link></div>
              <div className="mt-4 space-y-3">{debtors.map((store) => <Link key={store.id} href={`/admin/stores/${store.id}`} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 text-sm hover:text-violet-700"><span className="truncate">{store.name}</span><strong className="shrink-0 text-rose-700">{formatCurrency(store.debt)}</strong></Link>)}{debtors.length === 0 && <p className="text-sm text-zinc-500">Долгов нет.</p>}</div>
            </section>
          </div>
        </>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Магазины</span><strong className="mt-2 block text-3xl">{stores.length}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Долг магазинов</span><strong className={`mt-2 block text-3xl ${totalDebt > 0 ? "text-rose-700" : ""}`}>{formatCurrency(totalDebt)}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Стоимость остатков</span><strong className="mt-2 block text-3xl">{formatCurrency(stockValue)}</strong></div>
          <div className="surface-card p-5"><span className="text-sm text-zinc-500">Нерешённые жалобы</span><strong className="mt-2 block text-3xl">{complaints}</strong></div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Товаров</span><strong className="mt-2 block text-2xl">{products.length}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Установлено полок</span><strong className="mt-2 block text-2xl">{shelves}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Порча за месяц</span><strong className="mt-2 block text-2xl">{formatCurrency(spoilage._sum.amount ?? 0)}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Магазинов с долгом</span><strong className="mt-2 block text-2xl">{stores.filter((store) => store.debt > 0).length}</strong></div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 p-5"><div><h2 className="font-semibold">Последние заказы</h2><p className="mt-1 text-sm text-zinc-500">Новые и текущие поставки</p></div><Link className="text-sm font-semibold text-violet-700" href="/admin/orders">Все заказы →</Link></div>
          <div className="divide-y divide-zinc-100">{recentOrders.map((order) => <div key={order.id} className="grid gap-2 p-5 sm:grid-cols-[80px_1fr_auto] sm:items-center"><span className="text-sm font-semibold">№{order.id}</span><div><strong className="block text-sm">{order.store?.name ?? order.user.shopName}</strong><span className="text-xs text-zinc-500">{order.user.name} · {new Intl.DateTimeFormat("ru-RU").format(order.createdAt)}</span></div><div className="text-left sm:text-right"><strong className="block text-sm">{formatCurrency(order.total)}</strong><span className="text-xs text-zinc-500">{order.status}</span></div></div>)}{recentOrders.length === 0 && <p className="p-8 text-center text-zinc-500">Заказов пока нет.</p>}</div>
        </section>
        <section className="surface-card p-5"><h2 className="font-semibold">Быстрые действия</h2><div className="mt-4 grid gap-3"><Link href="/admin/products/new" className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50">Добавить товар →</Link><Link href="/admin/stores" className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50">Магазины и долги →</Link><Link href="/admin/routes" className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50">Линии и маршруты →</Link>{isDirector && <Link href="/admin/finance" className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50">Финансы →</Link>}<Link href="/admin/complaints" className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:border-violet-300 hover:bg-violet-50">Жалобы →</Link></div></section>
      </div>
    </div>
  );
}
