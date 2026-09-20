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
        throw new Error(result.error || "Не удалось удалить товар");
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Загрузка товаров...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <input className="input max-w-lg" placeholder="Поиск по названию, артикулу или категории" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span className="text-sm font-semibold text-slate-500">Показано: {visibleProducts.length} из {products.length}</span>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Фото</th><th className="px-5 py-4">Название</th><th className="px-5 py-4">Артикул</th><th className="px-5 py-4">Категория</th><th className="px-5 py-4">Цена</th><th className="px-5 py-4">Остаток</th><th className="px-5 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><ProductImage src={product.image} alt={product.name} className="size-14 rounded-lg" /></td>
                  <td className="px-5 py-4 font-bold text-slate-950">{product.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{product.article}</td>
                  <td className="px-5 py-4 text-slate-600">{product.category.name}</td>
                  <td className="px-5 py-4 font-bold text-slate-950">{formatCurrency(product.price)}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{product.stock}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Изменить</Link>
                      <button type="button" disabled={deletingId === product.id} onClick={() => void deleteProduct(product)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">{deletingId === product.id ? "Удаление..." : "Удалить"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleProducts.length === 0 && <div className="p-10 text-center text-slate-500">Товары не найдены.</div>}
      </div>
    </div>
  );
}
