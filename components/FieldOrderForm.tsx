"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

export function FieldOrderForm({ storeId, products }: { storeId: number; products: Product[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Наличные");
  const [comment, setComment] = useState("");
  const selected = useMemo(() => products.filter((p) => (qty[p.id] ?? 0) > 0), [products, qty]);
  const total = selected.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const debtPreview = paymentStatus === "UNPAID" ? total : paymentStatus === "PARTIAL" ? Math.max(0, total - (Number(paidAmount) || 0)) : 0;

  async function save() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/field/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId, paymentStatus, paidAmount, paymentMethod, comment, items: selected.map((p) => ({ productId: p.id, quantity: qty[p.id] })) }) });
      const data = await response.json() as { id?: number; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "Ошибка");
      router.push(`/field/stores/${storeId}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
    <div className="grid gap-4 sm:grid-cols-2">{products.map((p) => <article key={p.id} className="surface-card grid grid-cols-[100px_1fr] gap-3 p-3"><ProductImage src={p.image} alt={p.name} className="aspect-square w-full rounded-xl"/><div><h2 className="line-clamp-2 text-sm font-semibold">{p.name}</h2><p className="mt-1 text-xs text-zinc-500">{formatCurrency(p.price)} · остаток {p.stock}</p><input className="input mt-3 py-2" type="number" min="0" max={p.stock} value={qty[p.id] ?? 0} onChange={(e) => setQty((current) => ({ ...current, [p.id]: Math.max(0, Math.min(p.stock, Number(e.target.value) || 0)) }))}/></div></article>)}</div>
    <aside className="surface-card h-fit p-5 lg:sticky lg:top-6"><h2 className="font-semibold">Продажа в магазине</h2><div className="mt-4 space-y-2 text-sm">{selected.map((p) => <div key={p.id} className="flex justify-between gap-3"><span className="line-clamp-1">{p.name} × {qty[p.id]}</span><strong>{formatCurrency(p.price * qty[p.id])}</strong></div>)}{!selected.length && <p className="text-zinc-500">Укажите количество товаров.</p>}</div><div className="mt-4 flex justify-between border-t border-zinc-200 pt-4"><span>Итого</span><strong className="text-xl">{formatCurrency(total)}</strong></div>
      <label className="mt-5 block"><span className="field-label">Оплата</span><select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><option value="PAID">Оплачено полностью</option><option value="UNPAID">В долг</option><option value="PARTIAL">Частично</option><option value="CONSIGNMENT">На реализацию</option></select></label>
      {paymentStatus === "PARTIAL" && <label className="mt-4 block"><span className="field-label">Получено сейчас</span><input className="input" type="number" min="0" max={total} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>}
      {(paymentStatus === "PAID" || paymentStatus === "PARTIAL") && <label className="mt-4 block"><span className="field-label">Способ оплаты</span><select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Наличные</option><option>Перевод</option><option>Безнал</option><option>Другое</option></select></label>}
      {debtPreview > 0 && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">К долгу магазина добавится {formatCurrency(debtPreview)}</div>}
      <label className="mt-4 block"><span className="field-label">Комментарий</span><textarea className="input min-h-20" value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      {error && <div className="alert-error mt-4">{error}</div>}<button type="button" disabled={saving || !selected.length} onClick={() => void save()} className="button-primary mt-5 w-full">{saving ? "Сохраняем..." : "Оформить продажу"}</button>
    </aside>
  </div>;
}
