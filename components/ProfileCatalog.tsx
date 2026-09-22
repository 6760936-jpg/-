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
  const { addItem, items } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const filtered =
    activeCategory === null
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  return (
    <div>
      {/* Табы категорий */}
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

      {/* Товары */}
      {filtered.length === 0 ? (
        <div className="surface-card border-dashed p-10 text-center">
          <p className="text-zinc-500">В этой категории пока нет товаров.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const inCart = items.find((i) => i.product.id === p.id);
            const available = p.stock > 0;

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
                  {available ? `${p.stock} шт` : "Ожидается"}
                </div>

                <button
                  type="button"
                  disabled={!available}
                  onClick={() => addItem(p as any)}
                  className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    available
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "cursor-not-allowed bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {inCart
                    ? `В корзине: ${inCart.quantity}`
                    : available
                      ? "Добавить в корзину"
                      : "Нет в наличии"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}