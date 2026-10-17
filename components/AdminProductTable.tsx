/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";

export function AdminProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Состояние для прихода
  const [incomeId, setIncomeId] = useState<number | null>(null);
  const [incomeQty, setIncomeQty] = useState("");
  const [savingIncome, setSavingIncome] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error("Не удалось получить товары");
      setProducts((await response.json()) as Product[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, product.article, product.category.name].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [products, query]);

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return;
    setDeletingId(product.id);
    setError("");
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "Ошибка удаления");
      }
      setProducts((current) => current.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  }

  async function addStock(productId: number) {
    const qty = Number(incomeQty);
    if (!qty || qty < 1) return;
    
    setSavingIncome(true);
    setError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty, type: "INCOME" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Ошибка прихода");
      }
      setIncomeId(null);
      setIncomeQty("");
      await loadProducts(); // Обновляем список
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка прихода");
    } finally {
      setSavingIncome(false);
    }
  }

  if (loading) {
    return <div className="surface-card p-10 text-center text-zinc-500">Загрузка товаров…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">{error}</div>
      )}

      <div className="flex gap-3">
        <input
          className="input max-w-sm"
          placeholder="Поиск по названию, артикулу или категории..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Остаток</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 bg-zinc-100 rounded-lg overflow-hidden">
                        <ProductImage src={p.image} alt={p.name} className="size-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.article}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{p.category.name}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <strong className={p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : "text-emerald-600"}>
                      {p.stock} шт
                    </strong>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {incomeId === p.id ? (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                          <input
                            type="number"
                            className="w-16 px-2 py-1 text-sm border-none outline-none"
                            placeholder="Кол-во"
                            autoFocus
                            value={incomeQty}
                            onChange={(e) => setIncomeQty(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void addStock(p.id);
                              if (e.key === "Escape") setIncomeId(null);
                            }}
                          />
                          <button
                            onClick={() => void addStock(p.id)}
                            disabled={savingIncome}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            ОК
                          </button>
                          <button
                            onClick={() => setIncomeId(null)}
                            className="rounded px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIncomeId(p.id);
                            setIncomeQty("");
                          }}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                        >
                          + Приход
                        </button>
                      )}
                      
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => void deleteProduct(p)}
                        disabled={deletingId === p.id}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    Товаров не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}