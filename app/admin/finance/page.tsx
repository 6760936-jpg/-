import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import {
  createFinanceCategoryAction,
  createFinanceEntryAction,
  reverseFinanceEntryAction,
  toggleFinanceCategoryAction,
} from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function startOfDay(date: Date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; }
function inputDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export default async function FinancePage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireAdmin();
  if (user.role !== "DIRECTOR") return <div className="p-10"><div className="alert-error">Финансовые показатели доступны только генеральному директору.</div></div>;

  const query = await searchParams;
  const period = first(query.period) || "month";
  const now = new Date();
  let from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  let to = endOfDay(now);
  if (period === "today") from = startOfDay(now);
  if (period === "week") { from = startOfDay(now); from.setDate(from.getDate() - 6); }
  if (period === "all") { from = new Date("2000-01-01T00:00:00"); to = new Date("2100-01-01T00:00:00"); }
  if (period === "custom") {
    const rawFrom = first(query.from); const rawTo = first(query.to);
    if (rawFrom) from = startOfDay(new Date(`${rawFrom}T12:00:00`));
    if (rawTo) to = endOfDay(new Date(`${rawTo}T12:00:00`));
  }

  const [entries, orders, stores, categories, reversalRows] = await Promise.all([
    prisma.financeEntry.findMany({
      where: { entryDate: { gte: from, lte: to } },
      include: { createdBy: true, store: true, order: true },
      orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    }),
    prisma.order.findMany({ where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } } }),
    prisma.store.findMany({ orderBy: [{ debt: "desc" }, { name: "asc" }] }),
    prisma.financeCategory.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    prisma.financeEntry.findMany({ where: { isReversal: true, reversalOfId: { not: null } }, select: { reversalOfId: true } }),
  ]);

  const sales = orders.reduce((sum, order) => sum + order.total, 0);
  const income = entries.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + entry.amount, 0);
  const totalDebt = stores.reduce((sum, store) => sum + store.debt, 0);
  const expenseMap = new Map<string, number>();
  const incomeMap = new Map<string, number>();
  for (const entry of entries as Array<{ type: string; category: string; amount: number }>) {
    const target = entry.type === "EXPENSE" ? expenseMap : entry.type === "INCOME" ? incomeMap : null;
    if (target) target.set(entry.category, (target.get(entry.category) ?? 0) + entry.amount);
  }
  const expenseByCategory = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);
  const incomeByCategory = Array.from(incomeMap.entries()).sort((a, b) => b[1] - a[1]);
  const reversedIds = new Set(reversalRows.map((row) => row.reversalOfId).filter((id): id is number => id !== null));
  const activeCategories = categories.filter((category) => category.active);

  const periodLinks = [
    ["today", "Сегодня"], ["week", "7 дней"], ["month", "Месяц"], ["all", "Всё время"],
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="eyebrow">Кабинет генерального директора</p><h1 className="mt-2 text-3xl font-semibold">Финансы</h1><p className="mt-2 max-w-3xl text-zinc-500">Управленческий учёт: продажи, реальные поступления, расходы по статьям и задолженность магазинов. Не заменяет налоговую бухгалтерию.</p></div>
        <div className="flex flex-wrap gap-2">{periodLinks.map(([key, label]) => <Link key={key} href={`/admin/finance?period=${key}`} className={period === key ? "button-primary px-4 py-2" : "button-secondary px-4 py-2"}>{label}</Link>)}</div>
      </div>

      <form className="surface-card mt-5 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]" method="get">
        <input type="hidden" name="period" value="custom" />
        <label><span className="field-label">С даты</span><input className="input" type="date" name="from" defaultValue={inputDate(from)} /></label>
        <label><span className="field-label">По дату</span><input className="input" type="date" name="to" defaultValue={inputDate(to)} /></label>
        <button className="button-secondary self-end">Показать период</button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="surface-card p-5"><span className="text-sm text-zinc-500">Продажи по заказам</span><strong className="mt-2 block text-3xl">{formatCurrency(sales)}</strong></div>
        <div className="surface-card p-5"><span className="text-sm text-zinc-500">Получено денег</span><strong className="mt-2 block text-3xl text-emerald-700">{formatCurrency(income)}</strong></div>
        <div className="surface-card p-5"><span className="text-sm text-zinc-500">Расходы</span><strong className="mt-2 block text-3xl text-rose-700">{formatCurrency(expense)}</strong></div>
        <div className="surface-card p-5"><span className="text-sm text-zinc-500">Денежный результат</span><strong className="mt-2 block text-3xl">{formatCurrency(income - expense)}</strong></div>
        <div className="surface-card p-5"><span className="text-sm text-zinc-500">Долг магазинов сейчас</span><strong className={`mt-2 block text-3xl ${totalDebt > 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatCurrency(totalDebt)}</strong></div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="surface-card p-5"><h2 className="font-semibold">Расходы по статьям</h2><div className="mt-4 space-y-3">{expenseByCategory.map(([category, amount]) => <div key={category} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3"><span>{category}</span><strong className="text-rose-700">{formatCurrency(amount)}</strong></div>)}{expenseByCategory.length === 0 && <p className="text-sm text-zinc-500">В выбранном периоде расходов нет.</p>}</div></section>
        <section className="surface-card p-5"><h2 className="font-semibold">Поступления по статьям</h2><div className="mt-4 space-y-3">{incomeByCategory.map(([category, amount]) => <div key={category} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3"><span>{category}</span><strong className="text-emerald-700">{formatCurrency(amount)}</strong></div>)}{incomeByCategory.length === 0 && <p className="text-sm text-zinc-500">В выбранном периоде поступлений нет.</p>}</div></section>
      </div>

      <section className="mt-8 surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-5"><div><h2 className="font-semibold">Долги магазинов</h2><p className="mt-1 text-sm text-zinc-500">От большего долга к меньшему.</p></div><strong>{formatCurrency(totalDebt)}</strong></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500"><tr><th className="px-5 py-4">Магазин</th><th className="px-5 py-4">Адрес</th><th className="px-5 py-4">Долг</th><th className="px-5 py-4">Примечание</th><th className="px-5 py-4"></th></tr></thead><tbody className="divide-y divide-zinc-100">{stores.filter((store) => store.debt > 0).map((store) => <tr key={store.id}><td className="px-5 py-4 font-semibold">{store.name}</td><td className="px-5 py-4 text-zinc-500">{store.address}</td><td className="px-5 py-4 font-semibold text-rose-700">{formatCurrency(store.debt)}</td><td className="max-w-sm px-5 py-4 text-zinc-500">{store.notes ?? "—"}</td><td className="px-5 py-4"><Link className="font-semibold text-violet-700" href={`/admin/stores/${store.id}`}>Открыть →</Link></td></tr>)}{stores.every((store) => store.debt <= 0) && <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Долгов нет.</td></tr>}</tbody></table></div>
      </section>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form action={createFinanceEntryAction} className="surface-card space-y-4 p-5">
            <div><h2 className="font-semibold">Новая финансовая операция</h2><p className="mt-1 text-sm text-zinc-500">Для оплаты конкретного долга удобнее открыть карточку магазина.</p></div>
            <label><span className="field-label">Тип</span><select className="input" name="type"><option value="INCOME">Доход / поступление</option><option value="EXPENSE">Расход</option></select></label>
            <label><span className="field-label">Категория</span><input className="input" name="category" list="finance-categories" required /><datalist id="finance-categories">{activeCategories.map((category) => <option key={category.id} value={category.name}>{category.type === "INCOME" ? "Доход" : "Расход"}</option>)}</datalist></label>
            <label><span className="field-label">Сумма</span><input className="input" name="amount" type="number" min="0.01" step="0.01" required /></label>
            <label><span className="field-label">Магазин (если относится к нему)</span><select className="input" name="storeId"><option value="">Не привязывать</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name} — {store.address}</option>)}</select></label>
            <label><span className="field-label">Способ оплаты</span><select className="input" name="paymentMethod"><option value="">Не указан</option><option>Наличные</option><option>Перевод</option><option>Безнал</option><option>Другое</option></select></label>
            <label><span className="field-label">Дата</span><input className="input" name="entryDate" type="date" defaultValue={inputDate(now)} /></label>
            <label><span className="field-label">Комментарий</span><textarea className="input min-h-20" name="note" /></label>
            <button className="button-primary w-full">Записать операцию</button>
          </form>

          <section className="surface-card p-5">
            <h2 className="font-semibold">Статьи доходов и расходов</h2>
            <form action={createFinanceCategoryAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]"><input className="input" name="name" placeholder="Новая статья" required /><select className="input" name="type"><option value="EXPENSE">Расход</option><option value="INCOME">Доход</option></select><button className="button-secondary">Добавить</button></form>
            <div className="mt-4 space-y-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3"><div><strong className="text-sm">{category.name}</strong><span className="ml-2 text-xs text-zinc-500">{category.type === "INCOME" ? "доход" : "расход"}</span></div><form action={toggleFinanceCategoryAction}><input type="hidden" name="id" value={category.id}/><button className={category.active ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-zinc-500"}>{category.active ? "Активна" : "Отключена"}</button></form></div>)}</div>
          </section>
        </div>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-zinc-200 p-5"><h2 className="font-semibold">История операций</h2><p className="mt-1 text-sm text-zinc-500">Финансовая запись не удаляется бесследно: ошибочную операцию можно сторнировать.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500"><tr><th className="px-4 py-4">Дата</th><th className="px-4 py-4">Тип</th><th className="px-4 py-4">Категория</th><th className="px-4 py-4">Сумма</th><th className="px-4 py-4">Магазин</th><th className="px-4 py-4">Кто внёс</th><th className="px-4 py-4">Комментарий</th><th className="px-4 py-4"></th></tr></thead><tbody className="divide-y divide-zinc-100">{entries.map((entry) => <tr key={entry.id} className={entry.isReversal ? "bg-amber-50/60" : ""}><td className="px-4 py-4">{new Intl.DateTimeFormat("ru-RU").format(entry.entryDate)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.type === "INCOME" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{entry.type === "INCOME" ? "Доход" : "Расход"}</span></td><td className="px-4 py-4 font-medium">{entry.category}{entry.isReversal && <span className="ml-2 text-xs text-amber-700">сторно</span>}</td><td className="px-4 py-4 font-semibold">{formatCurrency(entry.amount)}</td><td className="px-4 py-4">{entry.store ? <Link href={`/admin/stores/${entry.store.id}`} className="font-semibold text-violet-700">{entry.store.name}</Link> : "—"}</td><td className="px-4 py-4 text-zinc-500">{entry.createdBy?.name ?? "Система"}</td><td className="max-w-xs px-4 py-4 text-zinc-500">{entry.note ?? "—"}</td><td className="px-4 py-4">{!entry.isReversal && !reversedIds.has(entry.id) ? <form action={reverseFinanceEntryAction}><input type="hidden" name="id" value={entry.id}/><button className="text-xs font-semibold text-rose-700">Сторнировать</button></form> : <span className="text-xs text-zinc-400">Зафиксировано</span>}</td></tr>)}{entries.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-zinc-500">Операций в выбранном периоде нет.</td></tr>}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
