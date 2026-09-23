import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { updateStopAction } from "@/lib/field-actions";
import {
  registerStorePaymentAction,
  updateStoreInternalNoteAction,
} from "@/lib/store-actions";

export const dynamic = "force-dynamic";

export default async function StopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireField();
  const { id } = await params;

  const stop = await prisma.routeStop.findUnique({
    where: { id: Number(id) },
    include: {
      store: { include: { shelves: true, routeLine: true } },
      route: true,
      order: { include: { items: true } },
    },
  });
  if (!stop) notFound();

  return (
    <div className="container-page max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Точка №{stop.sequence}</p>
          <h1 className="mt-2 text-3xl font-semibold">{stop.store.name}</h1>
          <p className="mt-2 text-zinc-500">{stop.store.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              stop.store.debt > 0
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            Долг: {formatCurrency(stop.store.debt)}
          </span>
          <span className="admin-chip">{stop.status}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
        <ProductImage
          src={stop.store.exteriorImage}
          alt={stop.store.name}
          className="aspect-[4/3] w-full rounded-2xl"
        />
        <div className="surface-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs text-zinc-400">Телефон</span>
              <strong className="mt-1 block">
                {stop.store.phone ?? "—"}
              </strong>
            </div>
            <div>
              <span className="text-xs text-zinc-400">Контакт</span>
              <strong className="mt-1 block">
                {stop.store.contactName ?? "—"}
              </strong>
            </div>
            <div>
              <span className="text-xs text-zinc-400">Режим работы</span>
              <strong className="mt-1 block">
                {stop.store.openingHours ?? "—"}
              </strong>
            </div>
            <div>
              <span className="text-xs text-zinc-400">Линия</span>
              <strong className="mt-1 block">
                {stop.store.routeLine?.title ?? "Не назначена"}
              </strong>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {stop.store.phone && (
              <a
                className="button-secondary"
                href={`tel:${stop.store.phone}`}
              >
                Позвонить
              </a>
            )}
            {stop.store.latitude && stop.store.longitude && (
              <a
                className="button-primary"
                target="_blank"
                rel="noreferrer"
                href={`https://yandex.ru/maps/?rtext=~${stop.store.latitude},${stop.store.longitude}&rtt=auto`}
              >
                Навигатор
              </a>
            )}
            <Link
              className="button-secondary"
              href={`/field/stores/${stop.store.id}`}
            >
              Карточка магазина
            </Link>
            <Link
              className="button-primary"
              href="/field/catalog"
            >
              Продать товар из машины
            </Link>
          </div>

          {stop.store.notes && (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Примечание:</strong> {stop.store.notes}
            </div>
          )}
        </div>
      </div>

      <section className="surface-card mt-6 p-5">
        <h2 className="font-semibold">Товар к выгрузке</h2>
        {stop.order ? (
          <>
            <div className="mt-4 divide-y divide-zinc-100">
              {stop.order.items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <strong className="text-sm">{i.productName}</strong>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {i.article}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong>{i.quantity} шт.</strong>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {formatCurrency(i.price * i.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4">
              <span>Сумма заказа</span>
              <strong>{formatCurrency(stop.order.total)}</strong>
            </div>
          </>
        ) : (
          <p className="mt-4 text-zinc-500">
            Предварительного заказа нет.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {stop.store.debt > 0 ? (
          <form
            action={registerStorePaymentAction}
            className="surface-card p-5"
          >
            <input
              type="hidden"
              name="storeId"
              value={stop.store.id}
            />
            <h2 className="font-semibold">Получить оплату долга</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Текущий долг: {formatCurrency(stop.store.debt)}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Сумма</span>
                <input
                  className="input"
                  name="amount"
                  type="number"
                  min="0.01"
                  max={stop.store.debt}
                  step="0.01"
                  required
                />
              </label>
              <label>
                <span className="field-label">Способ</span>
                <select className="input" name="paymentMethod">
                  <option>Наличные</option>
                  <option>Перевод</option>
                  <option>Безнал</option>
                  <option>Другое</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="field-label">Комментарий</span>
              <input className="input" name="note" />
            </label>
            <button className="button-primary mt-4">
              Записать оплату
            </button>
          </form>
        ) : (
          <div className="surface-card p-5">
            <h2 className="font-semibold">Задолженности нет</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Если сегодня оформляется новая продажа, способ оплаты
              фиксируется в форме продажи.
            </p>
          </div>
        )}

        <form
          action={updateStoreInternalNoteAction}
          className="surface-card p-5"
        >
          <input type="hidden" name="storeId" value={stop.store.id} />
          <h2 className="font-semibold">Примечание к магазину</h2>
          <textarea
            className="input mt-4 min-h-24"
            name="notes"
            defaultValue={stop.store.notes ?? ""}
          />
          <button className="button-secondary mt-4">
            Обновить примечание
          </button>
        </form>
      </div>

      <form
        action={updateStopAction}
        className="surface-card mt-6 grid gap-4 p-5 sm:grid-cols-[220px_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="id" value={stop.id} />
        <label>
          <span className="field-label">Статус визита</span>
          <select
            className="input"
            name="status"
            defaultValue={stop.status}
          >
            <option value="PLANNED">Запланировано</option>
            <option value="ARRIVED">На месте</option>
            <option value="DONE">Доставлено / выполнено</option>
            <option value="PROBLEM">Проблема</option>
          </select>
        </label>
        <label>
          <span className="field-label">Комментарий по визиту</span>
          <input
            className="input"
            name="note"
            defaultValue={stop.note ?? ""}
          />
        </label>
        <button className="button-primary">Сохранить визит</button>
      </form>
    </div>
  );
}