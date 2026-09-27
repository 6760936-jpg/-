import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRouteLineAction, deleteRouteLineAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактировать линию" };

export default async function EditLinePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const lineId = Number(id);
  if (!Number.isInteger(lineId)) notFound();

  const line = await prisma.routeLine.findUnique({
    where: { id: lineId },
    include: { _count: { select: { stores: true, routes: true } } },
  });
  if (!line) notFound();

  const canDelete = line._count.stores === 0 && line._count.routes === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-xl">
        <Link href="/admin/routes" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          ← Назад
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">Редактировать линию</h1>
        <p className="mt-2 text-zinc-500">
          Магазинов: {line._count.stores} · Маршрутов: {line._count.routes}
        </p>

        <form action={updateRouteLineAction} className="surface-card mt-8 space-y-4 p-6">
          <input type="hidden" name="id" value={line.id} />

          <label className="block">
            <span className="field-label">Название</span>
            <input className="input" name="title" defaultValue={line.title} required />
          </label>

          <label className="block">
            <span className="field-label">Описание района</span>
            <textarea className="input min-h-24" name="areaSummary" defaultValue={line.areaSummary ?? ""} />
          </label>

          <label className="block">
            <span className="field-label">Примечания</span>
            <textarea className="input min-h-24" name="notes" defaultValue={line.notes ?? ""} />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium">
            <input type="checkbox" name="active" value="true" defaultChecked={line.active} />
            Линия активна
          </label>

          <button className="button-primary w-full">Сохранить</button>
        </form>

        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="font-semibold text-rose-900">Удалить линию</h2>
          <p className="mt-1 text-sm text-rose-700">
            {canDelete ? "Линия будет удалена навсегда." : "Нельзя удалить: в линии есть магазины или маршруты."}
          </p>
          <form action={deleteRouteLineAction} className="mt-3">
            <input type="hidden" name="id" value={line.id} />
            <button
              disabled={!canDelete}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${canDelete ? "bg-rose-600 text-white hover:bg-rose-700" : "cursor-not-allowed bg-zinc-200 text-zinc-500"}`}
            >
              Удалить линию
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}