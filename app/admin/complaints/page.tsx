import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { updateComplaintStatusAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "SUGGESTION" ? "SUGGESTION" : "COMPLAINT";

  const [complaints, counts] = await Promise.all([
    prisma.complaint.findMany({
      where: { type: activeTab },
      include: { store: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.complaint.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  const complaintCount =
    counts.find((c) => c.type === "COMPLAINT")?._count._all ?? 0;
  const suggestionCount =
    counts.find((c) => c.type === "SUGGESTION")?._count._all ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div>
        <p className="eyebrow">Обратная связь</p>
        <h1 className="mt-2 text-3xl font-semibold">Предложения и жалобы</h1>
        <p className="mt-2 text-zinc-500">
          Обращения от магазинов-партнёров. Отвечайте и меняйте статус.
        </p>
      </div>

      <div className="mt-6 flex gap-2 border-b border-zinc-200">
        <Link
          href="/admin/complaints?tab=SUGGESTION"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            activeTab === "SUGGESTION"
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Предложения ({suggestionCount})
        </Link>
        <Link
          href="/admin/complaints?tab=COMPLAINT"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            activeTab === "COMPLAINT"
              ? "border-rose-600 text-rose-700"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Жалобы ({complaintCount})
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {complaints.map((c) => (
          <article key={c.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-violet-700">
                  {c.store.name}
                </span>
                <h2 className="mt-1 font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {c.description}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {formatDateTime(c.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  c.status === "RESOLVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : c.status === "IN_PROGRESS"
                      ? "bg-amber-50 text-amber-700"
                      : c.status === "REJECTED"
                        ? "bg-zinc-100 text-zinc-500"
                        : "bg-rose-50 text-rose-700"
                }`}
              >
                {c.status === "RESOLVED"
                  ? "Решено"
                  : c.status === "IN_PROGRESS"
                    ? "В работе"
                    : c.status === "REJECTED"
                      ? "Отклонено"
                      : "Новое"}
              </span>
            </div>

            <form
              action={updateComplaintStatusAction}
              className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-[180px_1fr_auto]"
            >
              <input type="hidden" name="id" value={c.id} />
              <select className="input" name="status" defaultValue={c.status}>
                <option value="NEW">Новое</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="RESOLVED">Решено</option>
                <option value="REJECTED">Отклонено</option>
              </select>
              <input
                className="input"
                name="resolution"
                defaultValue={c.resolution ?? ""}
                placeholder="Ответ магазину"
              />
              <button className="button-secondary">Сохранить</button>
            </form>
          </article>
        ))}

        {complaints.length === 0 && (
          <div className="surface-card p-10 text-center text-zinc-500">
            {activeTab === "SUGGESTION"
              ? "Предложений пока нет."
              : "Жалоб пока нет."}
          </div>
        )}
      </div>
    </div>
  );
}