import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = { title: "Полка и задолженность" };
export const dynamic = "force-dynamic";

export default async function ProfileWarehousePage() {
  const user = await requireUser("/profile/warehouse");

  const membership = await prisma.storeMembership.findFirst({
    where: { userId: user.id, active: true },
    include: { store: { include: { shelves: true } } },
  });

  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-8">
        <div className="surface-card border-dashed p-10 text-center">
          <h2 className="text-xl font-semibold">Магазин не привязан</h2>
          <p className="mt-2 text-zinc-500">
            Обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  const store = membership.store;
  const debt = store.debt;

  const payments = await prisma.financeEntry.findMany({
    where: { storeId: store.id, type: "INCOME" },
    orderBy: { entryDate: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-8">
      <div className="mb-8">
        <p className="eyebrow">Моя полка</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Полка и задолженность
        </h1>
        <p className="mt-2 text-zinc-500">
          {store.name} · {store.address}
        </p>
      </div>

      {/* Полка */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Полка</h2>
        {store.shelves.length === 0 ? (
          <div className="surface-card border-dashed p-8 text-center text-zinc-500">
            Полка не установлена.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {store.shelves.map((shelf) => (
              <div key={shelf.id} className="surface-card p-5">
                <span className="text-xs text-zinc-400">Номер полки</span>
                <strong className="mt-1 block text-2xl">{shelf.code}</strong>
                <p className="mt-2 text-xs text-zinc-500">
                  Статус: {shelf.status === "INSTALLED" ? "Установлена" : shelf.status}
                </p>
                {shelf.installedAt && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Установлена: {formatDate(shelf.installedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Задолженность */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Задолженность</h2>
        <div className="surface-card p-6">
          <span className="text-xs text-zinc-400">Текущий долг</span>
          <strong
            className={`mt-2 block text-4xl ${
              debt > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(debt)}
          </strong>
          <p className="mt-2 text-sm text-zinc-500">
            {debt > 0
              ? "Требуется оплата. Обратитесь к вашему менеджеру."
              : "Задолженности нет."}
          </p>
        </div>
      </section>

      {/* История оплат */}
      {payments.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">История оплат</h2>
          <div className="surface-card divide-y divide-zinc-100">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{p.category}</p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(p.entryDate)}
                  </p>
                </div>
                <strong className="text-emerald-600">
                  +{formatCurrency(p.amount)}
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}