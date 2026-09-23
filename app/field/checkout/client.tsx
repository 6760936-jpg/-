"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useFieldCart } from "@/context/FieldCartContext";
import { formatCurrency } from "@/lib/format";
import { sellMultipleFromVehicleAction } from "@/lib/field-actions";

type Store = { id: number; name: string; address: string };

export function FieldCheckoutClient({ stores }: { stores: Store[] }) {
  const { items, totalItems, totalPrice, clearCart } = useFieldCart();
  const [storeId, setStoreId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storeId) {
      setError("Выберите магазин");
      return;
    }
    if (items.length === 0) {
      setError("Корзина пуста");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const form = new FormData();
      form.set("storeId", storeId);
      form.set("paymentMethod", paymentMethod);
      form.set("note", note);
      form.set("items", JSON.stringify(items));
      await sellMultipleFromVehicleAction(form);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка продажи");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="surface-card border-dashed p-12 text-center">
        <h2 className="text-2xl font-semibold">Корзина пуста</h2>
        <Link href="/field/catalog" className="button-primary mt-6">
          Открыть каталог
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="space-y-6">
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold">Магазин</h2>
          <select
            className="input mt-4"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            <option value="">Выберите магазин</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.address}
              </option>
            ))}
          </select>
        </div>

        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold">Способ оплаты</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { v: "CASH", l: "Наличные" },
              { v: "CARD", l: "Карта" },
              { v: "DEBT", l: "В долг" },
            ].map((o) => (
              <label
                key={o.v}
                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === o.v
                    ? "border-violet-600 bg-violet-50 text-violet-800"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={o.v}
                  checked={paymentMethod === o.v}
                  onChange={() => setPaymentMethod(o.v)}
                  className="sr-only"
                />
                {o.l}
              </label>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold">Комментарий</h2>
          <textarea
            className="input mt-4 min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <aside className="surface-card h-fit p-6">
        <h2 className="text-xl font-semibold">Итого</h2>
        <div className="mt-5 space-y-2 border-b border-zinc-200 pb-4 text-sm">
          {items.map((i) => (
            <div
              key={i.productId}
              className="flex justify-between text-zinc-600"
            >
              <span className="truncate pr-2">
                {i.name} × {i.quantity}
              </span>
              <span>{formatCurrency(i.price * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-end justify-between pt-4">
          <span className="font-semibold">Сумма</span>
          <strong className="text-2xl font-semibold">
            {formatCurrency(totalPrice)}
          </strong>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Позиций: {items.length} · Штук: {totalItems}
        </p>

        {error && (
          <div className="alert-error mt-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="button-primary mt-6 w-full"
        >
          {submitting ? "Оформление..." : "Оформить продажу"}
        </button>
        <Link href="/field/cart" className="button-secondary mt-3 w-full">
          Назад в корзину
        </Link>
      </aside>
    </form>
  );
}