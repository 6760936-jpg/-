import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";

export const metadata = { title: "История заказов" };
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED"];

export default async function ProfileOrdersPage() {
  const user = await requireUser("/profile/orders");

  const membership = await prisma.storeMembership.findFirst({
    where: { userId: user.id, active: true },
  });

  const orders = await prisma.order.findMany({
    where: membership
      ? { OR: [{ userId: user.id }, { storeId: membership.storeId }] }
      : { userId: user.id },
    include: { items: { orderBy: { id: "asc" } }, store: true },
    orderBy: { createdAt: "desc" },
  });

  const activeOrders = orders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status),
  );
  const pastOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  return (
    <div className="container-page max-w-5xl">
      <div className="mb-8">
        <p className="eyebrow">Мои заказы</p>
        <h1 className="mt-2 text-3xl font-semibold">История заказов</h1>
        <p className="mt-2 text-zinc-500">
          Активные и завершённые заказы.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          Активные заказы{" "}
          <span className="text-zinc-400">({activeOrders.length})</span>
        </h2>
        {activeOrders.length === 0 ? (
          <div className="surface-card border-dashed p-8 text-center text-zinc-500">
            Нет активных заказов.
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          История{" "}
          <span className="text-zinc-400">({pastOrders.length})</span>
        </h2>
        {pastOrders.length === 0 ? (
          <div className="surface-card border-dashed p-8 text-center text-zinc-500">
            Завершённых заказов пока нет.
          </div>
        ) : (
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} muted />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type OrderWithItems = {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  comment: string | null;
  items: {
    id: number;
    productName: string;
    price: number;
    quantity: number;
  }[];
};

function OrderCard({
  order,
  muted = false,
}: {
  order: OrderWithItems;
  muted?: boolean;
}) {
  return (
    <article
      className={`surface-card p-5 ${muted ? "opacity-80" : ""}`}
    >
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
            {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
          </span>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 py-1">
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
  );
}