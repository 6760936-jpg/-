import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDeliveryRouteAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новый маршрут" };

export default async function NewRoutePage() {
  await requireAdmin();

  const [lines, drivers] = await Promise.all([
    prisma.routeLine.findMany({ where: { active: true }, orderBy: { title: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["DRIVER", "FIELD"] }, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-xl">
        <Link href="/admin/routes" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          ← Назад к маршрутам
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">Новый маршрут</h1>
        <p className="mt-2 text-zinc-500">
          Маршрут — это план на день. Выберите линию, дату и водителя.
        </p>

        <form action={createDeliveryRouteAction} className="surface-card mt-8 space-y-4 p-6">
          <label className="block">
            <span className="field-label">Линия</span>
            <select className="input" name="lineId" required>
              <option value="">Выберите линию</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Дата</span>
            <input className="input" name="routeDate" type="date" required />
          </label>

          <label className="block">
            <span className="field-label">Водитель</span>
            <select className="input" name="assignedUserId">
              <option value="">Не назначен</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Название (необязательно)</span>
            <input className="input" name="title" placeholder="Автоматически по линии и дате" />
          </label>

          <label className="block">
            <span className="field-label">Примечание</span>
            <textarea className="input min-h-24" name="notes" />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium">
            <input type="checkbox" name="onlyWithOrders" />
            Только магазины с заказами
          </label>

          <button className="button-primary w-full">Создать маршрут</button>
        </form>
      </div>
    </div>
  );
}