/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";
import type { Order } from "@/lib/types";

const TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "all", label: "Все", statuses: [] },
  { key: "new", label: "Новые", statuses: ["NEW"] },
  { key: "confirmed", label: "Подтверждённые", statuses: ["CONFIRMED"] },
  { key: "processing", label: "В сборке", statuses: ["PROCESSING"] },
  { key: "shipped", label: "В пути", statuses: ["SHIPPED"] },
  { key: "completed", label: "Завершённые", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Отменённые", statuses: ["CANCELLED"] },
];

export function AdminOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = (await response.json()) as Order[] | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          !Array.isArray(data) && data.error
            ? data.error
            : "Не удалось загрузить заказы.",
        );
      }
      setOrders(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить заказы.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function changeStatus(orderId: number, status: OrderStatus) {
    setSavingId(orderId);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as Order | { error?: string };
      if (!response.ok || !("id" in data)) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Не удалось изменить статус.",
        );
      }
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data : order)),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось изменить статус.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const tab of TABS) {
      if (tab.key === "all") continue;
      map[tab.key] = orders.filter((o) =>
        tab.statuses.includes(o.status as OrderStatus),
      ).length;
    }
    return map;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || tab.key === "all") return orders;
    return orders.filter((o) => tab.statuses.includes(o.status as OrderStatus));
  }, [orders, activeTab]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        Загрузка заказов…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {visibleOrders.length === 0 ? (
        <div className="surface-card border-dashed p-12 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">Заказов нет</h2>
          <p className="mt-2 text-zinc-500">
            {activeTab === "all"
              ? "Новый заказ появится здесь автоматически."
              : "В этой категории заказов нет."}
          </p>
        </div>
      ) : (
        visibleOrders.map((order) => {
          const expanded = expandedId === order.id;
          return (
            <article
              key={order.id}
              className="surface-card overflow-hidden"
            >
              <div className="grid gap-4 p-5 lg:grid-cols-[110px_1fr_170px_180px_130px] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Заказ
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    №{order.id}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-950">
                    {order.user.shopName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {order.user.name} · {order.user.phone}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Сумма
                  </p>
                  <p className="mt-1 font-semibold text-zinc-950">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Позиций: {order.items.length}
                  </p>
                </div>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Статус
                  </span>
                  <select
                    className="input py-2.5"
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(event) =>
                      void changeStatus(
                        order.id,
                        event.target.value as OrderStatus,
                      )
                    }
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="button-secondary px-4 py-2.5"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  {expanded ? "Скрыть" : "Подробнее"}
                </button>
              </div>

              {expanded && (
                <div className="border-t border-zinc-200 bg-zinc-50 p-5">
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Товар</th>
                          <th className="px-4 py-3">Артикул</th>
                          <th className="px-4 py-3">Цена</th>
                          <th className="px-4 py-3">Количество</th>
                          <th className="px-4 py-3">Сумма</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-zinc-950">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-zinc-500">
                              {item.article}
                            </td>
                            <td className="px-4 py-3">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3 font-bold">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {order.comment && (
                    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Комментарий покупателя
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                        {order.comment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}