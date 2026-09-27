import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { approveStoreAction, mergeStoreAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab =
    tab === "review" ? "review"
    : tab === "with-line" ? "with-line"
    : tab === "with-shelf" ? "with-shelf"
    : "all";

  const [allStores, lines] = await Promise.all([
    prisma.store.findMany({
      include: { shelves: true, routeLine: true, memberships: { include: { user: true } }, _count: { select: { orders: true, complaints: true } } },
      orderBy: [{ routeLineId: "asc" }, { routeOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.routeLine.findMany({ where: { active: true }, orderBy: { title: "asc" } }),
  ]);

  const reviewCount = allStores.filter((s) => s.needsReview).length;
  const withLineCount = allStores.filter((s) => s.routeLineId !== null).length;
  const withShelfCount = allStores.filter((s) => s.shelves.length > 0).length;

  const stores =
    activeTab === "review" ? allStores.filter((s) => s.needsReview)
    : activeTab === "with-line" ? allStores.filter((s) => s.routeLineId !== null)
    : activeTab === "with-shelf" ? allStores.filter((s) => s.shelves.length > 0)
    : allStores;

  const totalDebt = allStores.reduce((sum, store) => sum + store.debt, 0);
  const withGeo = allStores.filter((store) => store.latitude !== null && store.longitude !== null).length;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div>
        <p className="eyebrow">Клиентская база</p>
        <h1 className="mt-2 text-3xl font-semibold">Магазины</h1>
        <p className="mt-2 text-zinc-500">Адреса, геолокация, линии, задолженность и внутренние примечания.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Всего магазинов</span><strong className="mt-2 block text-2xl">{allStores.length}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">С точкой на карте</span><strong className="mt-2 block text-2xl">{withGeo}</strong></div>
        <div className="surface-card p-4"><span className="text-sm text-zinc-500">Общий долг</span><strong className={`mt-2 block text-2xl ${totalDebt > 0 ? "text-rose-700" : ""}`}>{formatCurrency(totalDebt)}</strong></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200">
        <Link href="/admin/stores" className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === "all" ? "border-violet-600 text-violet-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>Все ({allStores.length})</Link>
        <Link href="/admin/stores?tab=review" className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === "review" ? "border-amber-600 text-amber-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>В обработке ({reviewCount})</Link>
        <Link href="/admin/stores?tab=with-line" className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === "with-line" ? "border-violet-600 text-violet-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>С линией ({withLineCount})</Link>
        <Link href="/admin/stores?tab=with-shelf" className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === "with-shelf" ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>С полкой ({withShelfCount})</Link>
      </div>

      <div className="mt-8 space-y-4">
        {stores.map((store) => (
          <article key={store.id} className="surface-card grid gap-5 p-4 sm:grid-cols-[130px_1fr]">
            <ProductImage src={store.exteriorImage} alt={store.name} className="aspect-[4/3] w-full rounded-xl" />
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/stores/${store.id}`} className="text-lg font-semibold hover:text-violet-700">{store.name}</Link>
                  <p className="mt-1 text-sm text-zinc-500">{store.settlement ? `${store.settlement}, ` : ""}{store.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="admin-chip">{store.routeLine?.title ?? "Без линии"}</span>
                  {store.shelves.length > 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Полка {store.shelves.map((s) => s.code).join(", ")}</span>}
                  {store.needsReview && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Проверить</span>}
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-5">
                <div><span className="text-zinc-400">Телефон</span><strong className="block">{store.phone || "—"}</strong></div>
                <div><span className="text-zinc-400">Долг</span><strong className={`block ${store.debt > 0 ? "text-rose-700" : ""}`}>{formatCurrency(store.debt)}</strong></div>
                <div><span className="text-zinc-400">Населённый пункт</span><strong className="block">{store.settlement || "—"}</strong></div>
                <div><span className="text-zinc-400">Заказы</span><strong className="block">{store._count.orders}</strong></div>
                <div><span className="text-zinc-400">Полка</span><strong className="block">{store.shelves.map((s) => s.code).join(", ") || "Нет"}</strong></div>
              </div>
              {store.notes && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Примечание:</strong> {store.notes}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href={`/admin/stores/${store.id}`} className="button-secondary px-4 py-2">Карточка магазина</Link>
                {store.latitude !== null && store.longitude !== null && <a className="text-sm font-semibold text-violet-700" target="_blank" rel="noreferrer" href={`https://yandex.ru/maps/?rtext=~${store.latitude},${store.longitude}&rtt=auto`}>Маршрут →</a>}
                {store.needsReview && <form action={approveStoreAction}><input type="hidden" name="id" value={store.id} /><button className="text-sm font-semibold text-emerald-700">Подтвердить отдельным</button></form>}
              </div>
              {store.needsReview && (
                <form action={mergeStoreAction} className="mt-4 grid gap-2 rounded-xl bg-amber-50 p-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="sourceId" value={store.id} />
                  <select className="input bg-white" name="targetId" required>
                    <option value="">Объединить с существующим…</option>
                    {allStores.filter((candidate) => candidate.id !== store.id && !candidate.needsReview).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} — {candidate.address}</option>)}
                  </select>
                  <button className="button-secondary">Объединить</button>
                </form>
              )}
            </div>
          </article>
        ))}
        {stores.length === 0 && <div className="surface-card p-10 text-center text-zinc-500">{activeTab === "review" ? "Нет магазинов в обработке." : activeTab === "with-line" ? "Нет магазинов с линией." : activeTab === "with-shelf" ? "Нет магазинов с полкой." : "Магазинов пока нет."}</div>}
      </div>
      {lines.length === 0 && <p className="mt-6 text-sm text-amber-700">Линии ещё не созданы. Их можно настроить в разделе «Линии и маршруты».</p>}
    </div>
  );
}