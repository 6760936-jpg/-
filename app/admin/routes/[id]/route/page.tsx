import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDeliveryRouteAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактировать маршрут" };

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const routeId = Number(id);
  if (!Number.isInteger(routeId)) notFound();

  const route = await prisma.deliveryRoute.findUnique({
    where: { id: routeId },
    include: {
      assignedUser: true,
      line: true,
      stops: { orderBy: { sequence: "asc" }, include: { store: true } },
    },
  });
  if (!route) notFound();

  const drivers = await prisma.user.findMany({
    where: { role: { in: ["DRIVER", "FIELD"] }, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/routes" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          Назад к маршрутам
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{route.title}</h1>
        <p className="mt-2 text-zinc-500">
          Точек: {route.stops.length} · Линия: {route.line?.title ?? "нет"}
        </p>

        <form action={updateDeliveryRouteAction} className="surface-card mt-8 space-y-4 p-6">
          <input type="hidden" name="id" value={route.id} />

          <label className="block">
            <span className="field-label">Название</span>
            <input className="input" name="title" defaultValue={route.title} required />
          </label>

          <label className="block">
            <span className="field-label">Дата</span>
            <input className="input" type="date" name="routeDate" defaultValue={route.routeDate.toISOString().slice(0, 10)} required />
          </label>

          <label className="block">
            <span className="field-label">Водитель</span>
            <select className="input" name="assignedUserId" defaultValue={route.assignedUserId ?? ""}>
              <option value="">Не назначен</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Статус</span>
            <select className="input" name="status" defaultValue={route.status}>
              <option value="PLANNED">Запланирован</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Завершён</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Примечание</span>
            <textarea className="input min-h-24" name="notes" defaultValue={route.notes ?? ""} />
          </label>

          <button className="button-primary w-full">Сохранить</button>
        </form>

        <section className="surface-card mt-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Точки маршрута ({route.stops.length})</h2>
          {route.stops.length === 0 ? (
            <p className="text-sm text-zinc-500">В маршруте нет точек.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {route.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <strong className="block">{index + 1}. {stop.store.name}</strong>
                    <span className="text-xs text-zinc-500">
                      {stop.store.settlement ? `${stop.store.settlement}, ` : ""}{stop.store.address}
                    </span>
                  </span>
                  <Link href={`/admin/stores/${stop.store.id}`} className="shrink-0 text-xs font-semibold text-violet-700">
                    Открыть
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}