import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { LocationPicker } from "@/components/LocationPicker";
import { updateStoreAction } from "@/lib/admin-actions";
import { registerStorePaymentAction } from "@/lib/store-actions";

export const dynamic = "force-dynamic";

export default async function AdminStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const [store, lines] = await Promise.all([
    prisma.store.findUnique({
      where: { id },
      include: {
        routeLine: true,
        shelves: true,
        memberships: { include: { user: true } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 20 },
        financeEntries: { include: { createdBy: true }, orderBy: [{ entryDate: "desc" }, { id: "desc" }] },
      },
    }),
    prisma.routeLine.findMany({ orderBy: { title: "asc" } }),
  ]);
  if (!store) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Link href="/admin/stores" className="text-sm font-semibold text-violet-700">← Все магазины</Link><h1 className="mt-3 text-3xl font-semibold">{store.name}</h1><p className="mt-2 text-zinc-500">{store.address}</p></div>
        <div className="text-right"><span className="text-sm text-zinc-500">Текущий долг</span><strong className={`mt-1 block text-3xl ${store.debt > 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatCurrency(store.debt)}</strong></div>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[1.1fr_.9fr]">
        <form action={updateStoreAction} className="surface-card space-y-5 p-5">
          <input type="hidden" name="id" value={store.id} />
          <div><h2 className="font-semibold">Данные магазина</h2><p className="mt-1 text-sm text-zinc-500">Адрес, геолокация, долг, линия и внутреннее примечание.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">Название</span><input className="input" name="name" defaultValue={store.name} required /></label>
            <label><span className="field-label">Телефон</span><input className="input" name="phone" defaultValue={store.phone ?? ""} /></label>
            <label className="sm:col-span-2"><span className="field-label">Адрес</span><input className="input" name="address" defaultValue={store.address} required /></label>
            <label><span className="field-label">Контактное лицо</span><input className="input" name="contactName" defaultValue={store.contactName ?? ""} /></label>
            <label><span className="field-label">Режим работы</span><input className="input" name="openingHours" defaultValue={store.openingHours ?? ""} /></label>
            <label><span className="field-label">Статус</span><select className="input" name="status" defaultValue={store.status}><option value="LEAD">Новый контакт</option><option value="ACTIVE">Активный</option><option value="PAUSED">Приостановлен</option></select></label>
            <label><span className="field-label">Долг магазина, ₽</span><input className="input" name="debt" type="number" min="0" step="0.01" defaultValue={store.debt} /></label>
            <label><span className="field-label">Линия</span><select className="input" name="routeLineId" defaultValue={store.routeLineId ?? ""}><option value="">Без линии</option>{lines.map((line) => <option key={line.id} value={line.id}>{line.title}</option>)}</select></label>
            <label><span className="field-label">Порядок на линии</span><input className="input" name="routeOrder" type="number" min="0" step="1" defaultValue={store.routeOrder} /></label>
            <label className="sm:col-span-2"><span className="field-label">Внутреннее примечание</span><textarea className="input min-h-28" name="notes" defaultValue={store.notes ?? ""} placeholder="Старый текст можно стереть и написать новый." /></label>
            <div className="sm:col-span-2"><LocationPicker initialLatitude={store.latitude} initialLongitude={store.longitude} required /></div>
          </div>
          <button className="button-primary">Сохранить изменения</button>
        </form>

        <div className="space-y-6">
          {store.debt > 0 ? <form action={registerStorePaymentAction} className="surface-card space-y-4 p-5">
            <input type="hidden" name="storeId" value={store.id} />
            <div><h2 className="font-semibold">Принять оплату долга</h2><p className="mt-1 text-sm text-zinc-500">Текущий долг: {formatCurrency(store.debt)}. Оплата уменьшает долг и записывается в финансовую историю.</p></div>
            <label><span className="field-label">Сумма, ₽</span><input className="input" name="amount" type="number" min="0.01" max={store.debt} step="0.01" required /></label>
            <label><span className="field-label">Способ оплаты</span><select className="input" name="paymentMethod"><option>Наличные</option><option>Перевод</option><option>Безнал</option><option>Другое</option></select></label>
            <label><span className="field-label">Комментарий</span><input className="input" name="note" placeholder="Например: оплата за прошлую поставку" /></label>
            <button className="button-secondary w-full">Записать оплату</button>
          </form> : <div className="surface-card p-5"><h2 className="font-semibold">Задолженности нет</h2><p className="mt-2 text-sm text-zinc-500">Для других поступлений используйте раздел «Финансы».</p></div>}

          <section className="surface-card p-5">
            <h2 className="font-semibold">Контакты и навигация</h2>
            <div className="mt-4 space-y-2 text-sm"><p><span className="text-zinc-500">Телефон:</span> {store.phone ?? "—"}</p><p><span className="text-zinc-500">Контакт:</span> {store.contactName ?? "—"}</p><p><span className="text-zinc-500">Линия:</span> {store.routeLine?.title ?? "не назначена"}</p><p><span className="text-zinc-500">Полки:</span> {store.shelves.map((s) => s.code).join(", ") || "—"}</p></div>
            {store.latitude !== null && store.longitude !== null && <a target="_blank" rel="noreferrer" className="button-secondary mt-4 inline-flex" href={`https://yandex.ru/maps/?rtext=~${store.latitude},${store.longitude}&rtt=auto`}>Открыть маршрут</a>}
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="surface-card overflow-hidden"><div className="border-b border-zinc-200 p-5"><h2 className="font-semibold">Последние заказы</h2></div><div className="divide-y divide-zinc-100">{store.orders.map((order) => <div key={order.id} className="p-5"><div className="flex justify-between gap-3"><div><strong>Заказ №{order.id}</strong><p className="mt-1 text-xs text-zinc-500">{new Intl.DateTimeFormat("ru-RU").format(order.createdAt)} · {order.status} · {order.paymentStatus}</p></div><strong>{formatCurrency(order.total)}</strong></div><p className="mt-2 text-sm text-zinc-500">{order.items.map((item) => `${item.productName} × ${item.quantity}`).join("; ")}</p></div>)}{store.orders.length === 0 && <p className="p-6 text-zinc-500">Заказов пока нет.</p>}</div></section>
        <section className="surface-card overflow-hidden"><div className="border-b border-zinc-200 p-5"><h2 className="font-semibold">История оплат и финансовых операций</h2></div><div className="divide-y divide-zinc-100">{store.financeEntries.map((entry) => <div key={entry.id} className="p-5"><div className="flex justify-between gap-3"><div><strong>{entry.category}</strong><p className="mt-1 text-xs text-zinc-500">{new Intl.DateTimeFormat("ru-RU").format(entry.entryDate)} · {entry.paymentMethod ?? "способ не указан"} · {entry.createdBy?.name ?? "система"}</p></div><strong className={entry.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}>{entry.isReversal || entry.amount < 0 ? formatCurrency(entry.amount) : `${entry.type === "INCOME" ? "+" : "−"}${formatCurrency(entry.amount)}`}</strong></div>{entry.note && <p className="mt-2 text-sm text-zinc-500">{entry.note}</p>}</div>)}{store.financeEntries.length === 0 && <p className="p-6 text-zinc-500">Финансовых операций пока нет.</p>}</div></section>
      </div>
    </div>
  );
}
