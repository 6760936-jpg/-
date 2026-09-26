import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import {
  createDeliveryRouteAction,
  createRouteLineAction,
  moveRouteStopAction,
  moveStoreInLineAction,
  moveStoresToLineAction,
  removeRouteStopAction,
  updateDeliveryRouteAction,
  updateRouteLineAction,
  addRouteStopAction,
} from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Линии и маршруты" };

export default async function RoutesPage() {
  await requireAdmin();

  const [lines, stores, users, routes] = await Promise.all([
    prisma.routeLine.findMany({
      include: {
        stores: {
          orderBy: [{ routeOrder: "asc" }, { id: "asc" }],
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.store.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["DRIVER", "FIELD"] }, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.deliveryRoute.findMany({
      include: {
        assignedUser: true,
        line: true,
        stops: { orderBy: { sequence: "asc" }, include: { store: true } },
      },
      orderBy: { routeDate: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div>
        <p className="eyebrow">Логистика</p>
        <h1 className="mt-2 text-3xl font-semibold">Линии и маршруты</h1>
        <p className="mt-2 text-zinc-500">
          Разделите магазины на линии и сформируйте маршруты.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[400px_1fr]">
        <form
          action={createRouteLineAction}
          className="surface-card h-fit space-y-4 p-5"
        >
          <h2 className="font-semibold">Новая линия</h2>
          <label>
            <span className="field-label">Название</span>
            <input className="input" name="title" required />
          </label>
          <label>
            <span className="field-label">Описание</span>
            <textarea className="input min-h-20" name="areaSummary" />
          </label>
          <label>
            <span className="field-label">Примечания</span>
            <textarea className="input min-h-20" name="notes" />
          </label>
          <button className="button-primary w-full">Создать линию</button>
        </form>

        <div className="space-y-6">
          {lines.map((line) => (
            <section key={line.id} className="surface-card overflow-hidden">
              <div className="border-b border-zinc-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{line.title}</h3>
                    {line.areaSummary && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {line.areaSummary}
                      </p>
                    )}
                  </div>
                  <span className="admin-chip">
                    Магазинов: {line.stores.length}
                  </span>
                </div>
              </div>

              <form action={moveStoresToLineAction} className="p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">Магазины линии</h4>
                    <p className="mt-1 text-sm text-zinc-500">
                      Отметьте магазины и перенесите их в другую линию.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select className="input min-w-56" name="targetLineId">
                      <option value="">Без линии</option>
                      {lines
                        .filter((candidate) => candidate.id !== line.id)
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.title}
                          </option>
                        ))}
                    </select>
                    <button className="button-secondary">
                      Перенести выбранные
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                  {line.stores.map((store, index) => (
                    <div
                      key={store.id}
                      className="flex gap-3 rounded-xl border border-zinc-200 p-3"
                    >
                      <input
                        className="mt-1"
                        type="checkbox"
                        name="storeIds"
                        value={store.id}
                      />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm">
                          {index + 1}. {store.name}
                        </strong>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {store.address}
                        </span>
                        {store.debt > 0 && (
                          <span className="mt-1 block text-xs font-semibold text-rose-700">
                            Долг: {formatCurrency(store.debt)}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 flex-col gap-1">
                        <form action={moveStoreInLineAction}>
                          <input
                            type="hidden"
                            name="moveStore"
                            value={`${store.id}:up`}
                          />
                          <button
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveStoreInLineAction}>
                          <input
                            type="hidden"
                            name="moveStore"
                            value={`${store.id}:down`}
                          />
                          <button
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                            disabled={index === line.stores.length - 1}
                          >
                            ↓
                          </button>
                        </form>
                      </span>
                    </div>
                  ))}
                  {line.stores.length === 0 && (
                    <p className="text-sm text-zinc-500">
                      В линии пока нет магазинов.
                    </p>
                  )}
                </div>
              </form>

              <form
                action={addRouteStopAction}
                className="flex flex-wrap items-end gap-3 border-t border-zinc-200 p-5"
              >
                <input type="hidden" name="routeId" value="" />
                <label className="flex-1">
                  <span className="field-label">Добавить магазин</span>
                  <select className="input" name="storeId" required>
                    <option value="">Выберите магазин</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button-secondary">Добавить</button>
              </form>
            </section>
          ))}

          {lines.length === 0 && (
            <div className="surface-card p-10 text-center text-zinc-500">
              Линий пока нет. Создайте первую.
            </div>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">Маршруты</h2>

        <form
          action={createDeliveryRouteAction}
          className="surface-card mb-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <label>
            <span className="field-label">Линия</span>
            <select className="input" name="lineId" required>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Дата</span>
            <input className="input" name="routeDate" type="date" required />
          </label>
          <label>
            <span className="field-label">Водитель</span>
            <select className="input" name="assignedUserId">
              <option value="">Не назначен</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button-primary">Создать маршрут</button>
        </form>

        <div className="space-y-4">
          {routes.map((route) => (
            <article key={route.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{route.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "long",
                    }).format(route.routeDate)}
                    {route.assignedUser
                      ? ` · Водитель: ${route.assignedUser.name}`
                      : " · Не назначен"}
                  </p>
                </div>
                <span className="admin-chip">
                  {route.stops.length} точек · {route.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {route.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {stop.store.name}
                      </strong>
                      <span className="text-xs text-zinc-500">
                        {stop.store.address}
                      </span>
                    </span>
                    <form action={moveRouteStopAction}>
                      <input type="hidden" name="id" value={stop.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moveRouteStopAction}>
                      <input type="hidden" name="id" value={stop.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                        disabled={index === route.stops.length - 1}
                      >
                        ↓
                      </button>
                    </form>
                    <form action={removeRouteStopAction}>
                      <input type="hidden" name="id" value={stop.id} />
                      <button className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">
                        ✕
                      </button>
                    </form>
                  </div>
                ))}
                {route.stops.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    В маршруте пока нет точек.
                  </p>
                )}
              </div>
            </article>
          ))}

          {routes.length === 0 && (
            <div className="surface-card p-10 text-center text-zinc-500">
              Маршрутов пока нет.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}