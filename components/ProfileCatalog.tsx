"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  minOrder: number;
  categoryId: number;
};

type Category = {
  id: number;
  name: string;
};

export function ProfileCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { addItem, removeItem, setQuantity, items } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const filtered =
    activeCategory === null
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  function getQty(productId: number) {
    return items.find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  function changeQty(p: Product, next: number) {
    // 0 — удаляем
    if (next <= 0) {
      removeItem(p.id);
      return;
    }

    const capped = Math.min(next, p.stock);

    // Если товар уже в корзине — просто обновляем количество
    const existing = items.find((i) => i.product.id === p.id);
    if (existing) {
      setQuantity(p.id, capped);
      return;
    }

    // Первое добавление — минимум minOrder
    const start = Math.max(capped, p.minOrder);
    addItem(p as any);
    if (start !== p.minOrder) {
      setQuantity(p.id, Math.min(start, p.stock));
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeCategory === null
              ? "bg-violet-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeCategory === c.id
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card border-dashed p-10 text-center">
          <p className="text-zinc-500">В этой категории пока нет товаров.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const available = p.stock > 0;
            const qty = getQty(p.id);

            return (
              <div
                key={p.id}
                className="surface-card flex flex-col p-4 transition hover:shadow-md"
              >
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-zinc-50">
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    className="h-24 w-24 object-contain"
                  />
                </div>

                <p className="text-sm font-semibold">{p.name}</p>

                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-lg">
                    {formatCurrency(p.price)}
                  </strong>
                  {available ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      В наличии
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                      Нет
                    </span>
                  )}
                </div>

                <div className="mt-1 text-xs text-zinc-400">
                  {available ? `${p.stock} шт · мин. ${p.minOrder}` : "Ожидается"}
                </div>

                {available ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-300">
                    <button
                      type="button"
                      onClick={() => changeQty(p, qty - 1)}
                      className="flex size-10 items-center justify-center rounded-l-xl text-xl font-bold text-zinc-700 hover:bg-zinc-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={p.stock}
                      value={qty}
                      onChange={(e) => changeQty(p, Number(e.target.value))}
                      className="w-full min-w-0 border-x border-zinc-300 py-2 text-center text-base font-semibold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => changeQty(p, qty + 1)}
                      disabled={qty >= p.stock}
                      className="flex size-10 items-center justify-center rounded-r-xl text-xl font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-3 w-full cursor-not-allowed rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-400"
                  >
                    Нет в наличии
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}