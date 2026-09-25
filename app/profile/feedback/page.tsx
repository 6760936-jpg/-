import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { FeedbackForm } from "./form";

export const metadata = { title: "Предложения и жалобы" };
export const dynamic = "force-dynamic";

export default async function ProfileFeedbackPage() {
  const user = await requireUser("/profile/feedback");

  const membership = await prisma.storeMembership.findFirst({
    where: { userId: user.id, active: true },
  });

  const feedback = membership
    ? await prisma.complaint.findMany({
        where: { storeId: membership.storeId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-8">
        <p className="eyebrow">Обратная связь</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Предложения и жалобы
        </h1>
        <p className="mt-2 text-zinc-500">
          Сообщите о проблеме или предложите улучшение — мы ответим.
        </p>
      </div>

      {membership && <FeedbackForm />}

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Мои обращения</h2>

        {feedback.length === 0 ? (
          <div className="surface-card border-dashed p-8 text-center text-zinc-500">
            Обращений пока нет.
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => (
              <article key={item.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.type === "SUGGESTION"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.type === "SUGGESTION"
                        ? "Предложение"
                        : "Жалоба"}
                    </span>
                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === "RESOLVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700"
                            : item.status === "REJECTED"
                              ? "bg-zinc-100 text-zinc-500"
                              : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.status === "RESOLVED"
                        ? "Решено"
                        : item.status === "IN_PROGRESS"
                          ? "В работе"
                          : item.status === "REJECTED"
                            ? "Отклонено"
                            : "Новое"}
                    </span>
                    <p className="mt-2 text-xs text-zinc-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                {item.resolution && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    <strong>Ответ компании:</strong> {item.resolution}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}