"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

type CheckoutUser = {
  name: string;
  phone: string;
  shopName: string;
};

export function CheckoutClient({ user }: { user: CheckoutUser }) {
  const { items, totalPrice, clearCart } = useCart();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      comment: form.get("comment"),
      items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error ?? "Не удалось оформить заказ.");
      setOrderId(data.id);
      clearCart();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось оформить заказ.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div className="container-page min-h-[70vh]">
        <div className="mx-auto max-w-xl surface-card p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h1 className="mt-5 text-3xl font-semibold text-zinc-950">Заказ №{orderId} сохранён</h1>
          <p className="mt-3 leading-7 text-zinc-500">Заказ появился в вашем профиле и в админ-панели.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/profile" className="button-primary">Мои заказы</Link>
            <Link href="/catalog" className="button-secondary">Вернуться в каталог</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page min-h-[70vh]">
        <div className="surface-card border-dashed p-12 text-center">
          <h1 className="text-2xl font-semibold text-zinc-950">Нечего оформлять</h1>
          <p className="mt-2 text-zinc-500">Корзина пуста.</p>
          <Link href="/catalog" className="button-primary mt-6">В каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page min-h-[70vh]">
      <div className="mb-8">
        <p className="eyebrow">Подтверждение</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Оформление заказа</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="surface-card space-y-5 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <div className="rounded-xl bg-zinc-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Покупатель</p>
            <p className="mt-2 font-semibold text-zinc-950">{user.shopName}</p>
            <p className="mt-1 text-sm text-zinc-600">{user.name} · {formatPhone(user.phone)}</p>
            <Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900">Открыть профиль</Link>
          </div>

          <label className="block">
            <span className="field-label">Комментарий</span>
            <textarea className="input min-h-32" name="comment" maxLength={1000} placeholder="Адрес, удобное время или пожелания" />
          </label>

          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? "Сохраняем заказ…" : "Оформить заказ"}
          </button>
        </form>

        <aside className="surface-card h-fit p-6">
          <h2 className="text-xl font-semibold text-zinc-950">Ваш заказ</h2>
          <div className="mt-4 space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-600">{product.name} × {quantity}</span>
                <strong>{formatCurrency(product.price * quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5">
            <span className="font-bold">Итого</span>
            <strong className="text-xl font-black">{formatCurrency(totalPrice)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
