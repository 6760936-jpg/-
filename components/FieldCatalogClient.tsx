"use client";

import { useState } from "react";
import { useFieldCart } from "@/context/FieldCartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  article: string;
  price: number;
  image: string | null;
  minOrder: number;
  stock: number;
  categoryId: number;
  categoryName: string;
  inCar: number;
};

type Category = {
  id: number;
  name: string;
};

export function FieldCatalogClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { addItem, removeItem, items } = useFieldCart();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const filtered =
    activeCategory === null
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  function getQty(productId: number) {
    return items.find((i) => i.productId === productId)?.quantity ?? 0;
  }

  function setQty(p: Product, next: number) {
    if (next <= 0) {
      removeItem(p.id);
      return;
    }
    const capped = Math.min(next, p.inCar);
    addItem({
      productId: p.id,
      name: p.name,
      article: p.article,
      price: p.price,
      image: p.image,
      quantity: capped,
      maxQuantity: p.inCar,
    });
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const available = p.inCar > 0;
          const qty = getQty(p.id);

          return (
            <article key={p.id} className="surface-card flex flex-col p-3">
              <div className="grid grid-cols-[110px_1fr] gap-4">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  className="aspect-square w-full rounded-xl"
                />
                <div className="min-w-0 py-1">
                  <span className="text-xs text-violet-700">
                    {p.categoryName}
                  </span>
                  <h2 className="mt-1 line-clamp-2 font-semibold">
                    {p.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {available ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        В наличии: {p.inCar} шт
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                        В машине нет
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      На складе: {p.stock} шт
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <strong>{formatCurrency(p.price)}</strong>
                    <span className="text-xs text-zinc-400">
                      Мин. {p.minOrder} шт.
                    </span>
                  </div>
                </div>
              </div>

              {available ? (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-300">
                  <button
                    type="button"
                    onClick={() => setQty(p, qty - 1)}
                    disabled={qty === 0}
                    className="size-11 rounded-l-xl text-xl font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
                  >
                    −
                  </button>
                  <span className="text-base font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(p, qty + 1)}
                    disabled={qty >= p.inCar}
                    className="size-11 rounded-r-xl text-xl font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
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
                  Нет в машине
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}