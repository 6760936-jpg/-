import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StoreMap, type StoreMapPoint } from "@/components/StoreMap";
import {
  addRouteStopAction,
  createDeliveryRouteAction,
  createRouteLineAction,
  moveRouteStopAction,
  moveStoreInLineAction,
  moveStoresToLineAction,
  removeRouteStopAction,
  updateDeliveryRouteAction,
  updateRouteLineAction,
} from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

function dateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function RoutesPage() {
  const [lines, routes, workers, allStores] = await Promise.all([
    prisma.routeLine.findMany({ include: { stores: { orderBy: [{ routeOrder: "asc" }, { id: "asc" }] }, _count: { select: { routes: true } } }, orderBy: [{ active: "desc" }, { title: "asc" }] }),
    prisma.deliveryRoute.findMany({ include: { line: true, assignedUser: true, stops: { include: { store: true, order: { include: { items: true } } }, orderBy: { sequence: "asc" } } }, orderBy: [{ routeDate: "desc" }, { id: "desc" }] }),
    prisma.user.findMany({ where: { role: { in: ["FIELD", "DRIVER"] }, active: true }, orderBy: { name: "asc" } }),
    prisma.store.findMany({ include: { routeLine: true }, orderBy: [{ routeLineId: "asc" }, { routeOrder: "asc" }, { name: "asc" }] }),
  ]);

  const todayKey = dateInput(new Date());
  const todayStoreStatus = new Map<number, string>();
  for (const route of routes) {
    if (dateInput(route.routeDate) !== todayKey) continue;
    for (const stop of route.stops) todayStoreStatus.set(stop.storeId, stop.status);
  }
  const mapPoints: StoreMapPoint[] = allStores
    .filter((store) => store.latitude !== null && store.longitude !== null)
    .map((store) => ({
      id: store.id, name: store.name, address: store.address, phone: store.phone,
      latitude: store.latitude!, longitude: store.longitude!, debt: store.debt, notes: store.notes,
      lineId: store.routeLineId, lineTitle: store.routeLine?.title, today: todayStoreStatus.has(store.id), stopStatus: todayStoreStatus.get(store.id) ?? null,
    }));

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Логистика</p><h1 className="mt-2 text-3xl font-semibold">Линии и маршруты</h1><p className="mt-2 max-w-3xl text-zinc-500">Линия — постоянная территория и порядок магазинов. Маршрут — конкретная поездка водителя на выбранную дату.</p></div>
        <Link href="/field/map" className="button-secondary">Карта водителя</Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Все магазины на карте</h2>
        <p className="mt-1 text-sm text-zinc-500">Можно увидеть все зарегистрированные точки, отдельную линию или только сегодняшние точки.</p>
        <div className="mt-4"><StoreMap stores={mapPoints} /></div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[360px_1fr]">
        <form action={createRouteLineAction} className="surface-card h-fit space-y-4 p-5">
          <div><h2 className="font-semibold">Новая линия</h2><p className="mt-1 text-sm text-zinc-500">Например: «Линия №1 — Север».</p></div>
          <label><span className="field-label">Название</span><input className="input" name="title" required /></label>
          <label><span className="field-label">Город и посёлки</span><textarea className="input min-h-24" name="areaSummary" placeholder="Город N → пос. А → пос. Б → пос. В" /></label>
          <label><span className="field-label">Примечание</span><textarea className="input min-h-20" name="notes" /></label>
          <button className="button-primary w-full">Создать линию</button>
        </form>

        <div className="space-y-5">
          {lines.map((line) => (
            <article key={line.id} className="surface-card overflow-hidden">
              <div className="border-b border-zinc-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{line.title}</h3><p className="mt-1 text-sm text-zinc-500">{line.areaSummary || "Территория пока не описана"}</p></div><div className="flex gap-2"><span className="admin-chip">{line.stores.length} магазинов</span><span className="admin-chip">{line._count.routes} поездок</span>{!line.active && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">Отключена</span>}</div></div>
                <form action={updateRouteLineAction} className="mt-4 grid gap-3 lg:grid-cols-4">
                  <input type="hidden" name="id" value={line.id} />
                  <input className="input" name="title" defaultValue={line.title} required />
                  <input className="input lg:col-span-2" name="areaSummary" defaultValue={line.areaSummary ?? ""} placeholder="Город и посёлки" />
                  <select className="input" name="active" defaultValue={String(line.active)}><option value="true">Активна</option><option value="false">Отключена</option></select>
                  <textarea className="input min-h-20 lg:col-span-3" name="notes" defaultValue={line.notes ?? ""} placeholder="Примечание к линии" />
                  <button className="button-secondary h-fit">Сохранить линию</button>
                </form>
              </div>

              <form action={moveStoresToLineAction} className="p-5">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><h4 className="font-semibold">Магазины линии</h4><p className="mt-1 text-sm text-zinc-500">Отметьте магазины и перенесите их в другую линию — так можно быстро разделить перегруженный маршрут.</p></div><div className="flex flex-wrap gap-2"><select className="input min-w-56" name="targetLineId"><option value="">Без линии</option>{lines.filter((candidate) => candidate.id !== line.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select><button className="button-secondary">Перенести выбранные</button></div></div>
                <div className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                  {line.stores.map((store, index) => <div key={store.id} className="flex gap-3 rounded-xl border border-zinc-200 p-3"><input className="mt-1" type="checkbox" name="storeIds" value={store.id} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{index + 1}. {store.name}</strong><span className="mt-1 block text-xs text-zinc-500">{store.address}</span>{store.debt > 0 && <span className="mt-1 block text-xs font-semibold text-rose-700">Долг: {new Intl.NumberFormat("ru-RU").format(store.debt)} ₽</span>}</span><span className="flex shrink-0 flex-col gap-1"><button formAction={moveStoreInLineAction} name="moveStore" value={`${store.id}:up`} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs" disabled={index === 0}>↑</button><button formAction={moveStoreInLineAction} name="moveStore" value={`${store.id}:down`} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs" disabled={index === line.stores.length - 1}>↓</button></span></div>)}
                  {line.stores.length === 0 && <p className="text-sm text-zinc-500">В линии пока нет магазинов.</p>}
                </div>
              </form>
            </article>
          ))}
          {lines.length === 0 && <div className="surface-card p-8 text-center text-zinc-500">Создайте первую линию.</div>}

          {allStores.some((store) => !store.routeLineId) && (
            <form action={moveStoresToLineAction} className="surface-card p-5">
              <h3 className="font-semibold">Магазины без линии</h3><p className="mt-1 text-sm text-zinc-500">Выберите точки и назначьте постоянную линию.</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">{allStores.filter((store) => !store.routeLineId).map((store) => <label key={store.id} className="flex gap-3 rounded-xl border border-zinc-200 p-3"><input type="checkbox" name="storeIds" value={store.id} /><span><strong className="block text-sm">{store.name}</strong><span className="text-xs text-zinc-500">{store.address}</span></span></label>)}</div>
              <div className="mt-4 flex flex-wrap gap-2"><select className="input min-w-64" name="targetLineId" required><option value="">Выберите линию…</option>{lines.filter((line) => line.active).map((line) => <option key={line.id} value={line.id}>{line.title}</option>)}</select><button className="button-primary">Назначить</button></div>
            </form>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div><h2 className="text-xl font-semibold">Создать маршрут на день</h2><p className="mt-1 text-sm text-zinc-500">Можно взять все магазины линии или только магазины, у которых сейчас есть открытые заказы.</p></div>
        <form action={createDeliveryRouteAction} className="surface-card mt-4 grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <label><span className="field-label">Линия</span><select className="input" name="lineId" required><option value="">Выберите…</option>{lines.filter((line) => line.active).map((line) => <option key={line.id} value={line.id}>{line.title}</option>)}</select></label>
          <label><span className="field-label">Дата</span><input className="input" type="date" name="routeDate" defaultValue={todayKey} required /></label>
          <label><span className="field-label">Водитель / сотрудник</span><select className="input" name="assignedUserId"><option value="">Не назначен</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name} — {worker.role === "DRIVER" ? "водитель" : "сотрудник"}</option>)}</select></label>
          <label><span className="field-label">Название (необязательно)</span><input className="input" name="title" placeholder="Создастся автоматически" /></label>
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4"><input type="checkbox" name="onlyWithOrders" /><span className="text-sm font-semibold">Только с заказами</span></label>
          <label className="sm:col-span-2 xl:col-span-4"><span className="field-label">Примечание</span><input className="input" name="notes" /></label>
          <button className="button-primary">Создать маршрут</button>
        </form>
      </section>

      <section className="mt-10 space-y-6">
        <div><h2 className="text-xl font-semibold">Маршруты по датам</h2><p className="mt-1 text-sm text-zinc-500">Редактируйте водителя, дату, порядок и состав точек.</p></div>
        {routes.map((route) => (
          <article key={route.id} className="surface-card overflow-hidden">
            <div className="border-b border-zinc-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{route.title}</h3><p className="mt-1 text-sm text-zinc-500">{route.line?.title ?? "Без постоянной линии"} · {route.stops.length} точек</p></div><span className="admin-chip">{new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(route.routeDate)}</span></div>
              <form action={updateDeliveryRouteAction} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <input type="hidden" name="id" value={route.id} />
                <input className="input xl:col-span-2" name="title" defaultValue={route.title} required />
                <input className="input" type="date" name="routeDate" defaultValue={dateInput(route.routeDate)} required />
                <select className="input" name="assignedUserId" defaultValue={route.assignedUserId ?? ""}><option value="">Не назначен</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select>
                <select className="input" name="status" defaultValue={route.status}><option value="PLANNED">Запланирован</option><option value="IN_PROGRESS">В пути</option><option value="DONE">Завершён</option><option value="CANCELLED">Отменён</option></select>
                <button className="button-secondary">Сохранить</button>
                <input className="input sm:col-span-2 xl:col-span-6" name="notes" defaultValue={route.notes ?? ""} placeholder="Примечание к маршруту" />
              </form>
            </div>
            <div className="divide-y divide-zinc-100">
              {route.stops.map((stop, index) => (
                <div key={stop.id} className="grid gap-3 p-4 md:grid-cols-[48px_1fr_1fr_auto] md:items-center">
                  <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 font-semibold text-white">{stop.sequence}</span>
                  <div><Link href={`/admin/stores/${stop.store.id}`} className="font-semibold hover:text-violet-700">{stop.store.name}</Link><p className="mt-1 text-sm text-zinc-500">{stop.store.address}</p>{stop.store.debt > 0 && <p className="mt-1 text-xs font-semibold text-rose-700">Долг: {new Intl.NumberFormat("ru-RU").format(stop.store.debt)} ₽</p>}</div>
                  <div>{stop.order ? <><span className="text-xs font-semibold text-violet-700">Заказ №{stop.order.id}</span><p className="mt-1 text-xs text-zinc-500">{stop.order.items.map((item) => `${item.productName} × ${item.quantity}`).join("; ")}</p></> : <span className="text-sm text-zinc-500">Визит без заказа</span>}{stop.store.notes && <p className="mt-2 text-xs text-amber-700">{stop.store.notes}</p>}</div>
                  <div className="flex flex-wrap gap-1 md:justify-end">
                    <form action={moveRouteStopAction}><input type="hidden" name="id" value={stop.id}/><input type="hidden" name="direction" value="up"/><button className="button-secondary px-3 py-2" disabled={index === 0}>↑</button></form>
                    <form action={moveRouteStopAction}><input type="hidden" name="id" value={stop.id}/><input type="hidden" name="direction" value="down"/><button className="button-secondary px-3 py-2" disabled={index === route.stops.length - 1}>↓</button></form>
                    <form action={removeRouteStopAction}><input type="hidden" name="id" value={stop.id}/><button className="px-3 py-2 text-sm font-semibold text-rose-700">Убрать</button></form>
                    <Link href={`/field/stops/${stop.id}`} className="button-secondary px-3 py-2">Открыть</Link>
                  </div>
                </div>
              ))}
            </div>
            <form action={addRouteStopAction} className="flex flex-wrap gap-2 border-t border-zinc-200 bg-zinc-50 p-4">
              <input type="hidden" name="routeId" value={route.id}/>
              <select className="input min-w-64 flex-1" name="storeId" required><option value="">Добавить магазин в маршрут…</option>{allStores.filter((store) => !route.stops.some((stop) => stop.storeId === store.id)).map((store) => <option key={store.id} value={store.id}>{store.name} — {store.address}</option>)}</select>
              <button className="button-secondary">Добавить точку</button>
            </form>
          </article>
        ))}
        {routes.length === 0 && <div className="surface-card p-10 text-center text-zinc-500">Маршрутов пока нет.</div>}
      </section>
    </div>
  );
}
