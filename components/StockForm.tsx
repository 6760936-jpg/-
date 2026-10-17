"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Product = { id: number; name: string; stock: number };

export function StockForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("INCOME");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productId || !quantity) {
      setError("Выберите товар и количество");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(productId), quantity: Number(quantity), type }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Ошибка");
      }
      setProductId("");
      setQuantity("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-4 p-5">
      <h2 className="font-semibold">Быстрое движение</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${type === "INCOME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-zinc-200 text-zinc-600"}`}
        >
          + Приход
        </button>
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${type === "EXPENSE" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-zinc-200 text-zinc-600"}`}
        >
          − Расход
        </button>
      </div>

      <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)} required>
        <option value="">Выберите товар</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name} (остаток: {p.stock})</option>
        ))}
      </select>

      <input className="input" type="number" min="1" placeholder="Количество" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

      {error && <div className="alert-error">{error}</div>}

      <button type="submit" disabled={submitting} className="button-primary w-full">
        {submitting ? "Сохранение..." : "Провести"}
      </button>
    </form>
  );
}