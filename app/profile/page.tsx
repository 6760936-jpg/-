import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { ProfileCatalog } from "@/components/ProfileCatalog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  DIRECTOR: "Генеральный директор",
  ADMIN: "Администратор",
  FIELD: "Выездной сотрудник",
  DRIVER: "Водитель",
  CUSTOMER: "Покупатель",
  MANAGER: "Менеджер",
  WAREHOUSE: "Кладовщик",
};

const ACTIVE_STATUSES = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED"];

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  const membership = await prisma.storeMembership.findFirst({
    where: { userId: user.id, active: true },
    include: { store: { include: { shelves: true } } },
  });

  const orders = await prisma.order.findMany({
    where: membership
      ? { OR: [{ userId: user.id }, { storeId: membership.storeId }] }
      : { userId: user.id },
    include: { items: { orderBy: { id: "asc" } }, store: true },
    orderBy: { createdAt: "desc" },
  });

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const debt = membership?.store.debt ?? 0;

  const payments = membership
    ? await prisma.financeEntry.findMany({
        where: { storeId: membership.storeId, type: "INCOME" },
        orderBy: { entryDate: "desc" },
        take: 5,
      })
    : [];

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="container-page min-h-[70vh]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {membership?.store.name ?? user.shopName}
          </h1>
          <p className="mt-2 text-zinc-500">
            {user.name} · {formatPhone(user.phone)}
          </p>
          <span className="admin-chip mt-3">
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["DIRECTOR", "ADMIN"].includes(user.role) && (
            <Link href="/admin" className="button-secondary">
              Панель управления
            </Link>
          )}
          {["FIELD", "DRIVER", "DIRECTOR", "ADMIN"].includes(user.role) && (
            <Link href="/field" className="button-secondary">
              Рабочий кабинет
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {membership && (
        <div className="surface-card mb-6 grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <span className="text-xs text-zinc-400">Адрес</span>
            <strong className="mt-1 block">{membership.store.address}</strong>
          </div>
          <div>
            <span className="text-xs text-zinc-400">Номер полки</span>
            <strong className="mt-1 block">
              {membership.store.shelves.map((s) => s.code).join(", ") ||
                "Полки нет"}
            </strong>
          </div>
          <div>
            <span className="text-xs text-zinc-400">Геолокация</span>
            <strong className="mt-1 block">
              {membership.store.latitude && membership.store.longitude
                ? "Указана"
                : "Нужно указать"}
            </strong>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <span className="text-xs text-zinc-400">Баланс</span>
          <strong
            className={`mt-2 block text-3xl ${
              debt > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {debt > 0 ? "−" : ""}
            {formatCurrency(Math.abs(debt))}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">
            {debt > 0 ? "Есть долг" : "Долга нет"}
          </p>
        </div>
        <div className="surface-card p-5">
          <span className="text-xs text-zinc-400">Активные заказы</span>
          <strong className="mt-2 block text-3xl">{activeOrders.length}</strong>
          <p className="mt-1 text-xs text-zinc-400">
            {activeOrders.length > 0 ? "В работе" : "Нет активных"}
          </p>
        </div>
        <div className="surface-card p-5">
          <span className="text-xs text-zinc-400">Задолженность</span>
          <strong
            className={`mt-2 block text-3xl ${
              debt > 0 ? "text-red-600" : "text-zinc-900"
            }`}
          >
            {formatCurrency(debt)}
          </strong>
          <p className="mt-1 text-xs text-zinc-400">
            {debt > 0 ? "Требуется оплата" : "Всё оплачено"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="h-fit">
          <ProfileSettingsForm
            initialName={user.name}
            initialShopName={user.shopName}
            initialPhone={formatPhone(user.phone)}
            hasStore={Boolean(membership)}
            initialAddress={membership?.store.address ?? ""}
            initialLatitude={membership?.store.latitude ?? null}
            initialLongitude={membership?.store.longitude ?? null}
          />
        </aside>

        <section className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Активные заказы</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Заказы, которые сейчас в работе.
                </p>
              </div>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <article key={order.id} className="surface-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Заказ №{order.id}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                            order.status}
                        </span>
                        <strong>{formatCurrency(order.total)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Каталог товаров</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Быстрый заказ из кабинета.
                </p>
              </div>
              <Link href="/catalog" className="button-secondary">
                Весь каталог →
              </Link>
            </div>
            <ProfileCatalog products={products} categories={categories} />
          </div>

          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Мои заказы</h2>
              <p className="mt-1 text-sm text-zinc-500">
                История, суммы и текущие статусы.
              </p>
            </div>
            {orders.length === 0 ? (
              <div className="surface-card border-dashed p-10 text-center">
                <h3 className="text-xl font-semibold">Заказов пока нет</h3>
                <Link href="/catalog" className="button-primary mt-5">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <article key={order.id} className="surface-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Заказ №{order.id}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                            order.status}
                        </span>
                        <strong>{formatCurrency(order.total)}</strong>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-zinc-100 pt-4 text-sm">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 py-1"
                        >
                          <span className="text-zinc-600">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {order.comment && (
                      <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                        {order.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {payments.length > 0 && (
            <div>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Мои оплаты</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Последние поступления.
                </p>
              </div>
              <div className="surface-card divide-y divide-zinc-100">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.category}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDateTime(p.entryDate)}
                      </p>
                    </div>
                    <strong className="text-emerald-600">
                      +{formatCurrency(p.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}