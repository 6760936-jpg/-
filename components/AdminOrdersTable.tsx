/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";
import type { Order } from "@/lib/types";

export function AdminOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = (await response.json()) as Order[] | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(!Array.isArray(data) && data.error ? data.error : "Не удалось загрузить заказы.");
      }
      setOrders(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказы.");
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
        throw new Error("error" in data && data.error ? data.error : "Не удалось изменить статус.");
      }
      setOrders((current) => current.map((order) => (order.id === orderId ? data : order)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось изменить статус.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Загрузка заказов…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Заказов пока нет</h2>
          <p className="mt-2 text-slate-500">Новый оформленный заказ появится здесь автоматически.</p>
        </div>
      ) : (
        orders.map((order) => {
          const expanded = expandedId === order.id;
          return (
            <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-4 p-5 lg:grid-cols-[110px_1fr_170px_180px_130px] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Заказ</p>
                  <p className="mt-1 text-lg font-black text-slate-950">№{order.id}</p>
                </div>

                <div>
                  <p className="font-black text-slate-950">{order.user.shopName}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.user.name} · {order.user.phone}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Сумма</p>
                  <p className="mt-1 font-black text-slate-950">{formatCurrency(order.total)}</p>
                  <p className="mt-1 text-xs text-slate-500">Позиций: {order.items.length}</p>
                </div>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Статус</span>
                  <select
                    className="input py-2.5"
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
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
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Товар</th>
                          <th className="px-4 py-3">Артикул</th>
                          <th className="px-4 py-3">Цена</th>
                          <th className="px-4 py-3">Количество</th>
                          <th className="px-4 py-3">Сумма</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-slate-950">{item.productName}</td>
                            <td className="px-4 py-3 text-slate-500">{item.article}</td>
                            <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3 font-bold">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {order.comment && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Комментарий покупателя</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{order.comment}</p>
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
