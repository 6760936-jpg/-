import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createRouteLineAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новая линия" };

export default async function NewLinePage() {
  await requireAdmin();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-xl">
        <Link href="/admin/routes" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          ← Назад к линиям
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">Новая линия</h1>
        <p className="mt-2 text-zinc-500">
          Линия — это район с магазинами. Маршруты формируются внутри линии.
        </p>

        <form action={createRouteLineAction} className="surface-card mt-8 space-y-4 p-6">
          <label className="block">
            <span className="field-label">Название</span>
            <input className="input" name="title" required placeholder="Например, Хасавюртовский район" />
          </label>

          <label className="block">
            <span className="field-label">Описание района</span>
            <textarea className="input min-h-24" name="areaSummary" placeholder="Кратко о районе, населённых пунктах" />
          </label>

          <label className="block">
            <span className="field-label">Примечания</span>
            <textarea className="input min-h-24" name="notes" />
          </label>

          <button className="button-primary w-full">Создать линию</button>
        </form>
      </div>
    </div>
  );
}