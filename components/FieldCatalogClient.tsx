"use client";

import { useState } from "react";
import { useFieldCart } from "@/context/FieldCartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { FieldPhotoViewer } from "@/components/FieldPhotoViewer";

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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {filtered.map((p, index) => {
          const available = p.inCar > 0;
          const qty = getQty(p.id);

          return (
            <article
              key={p.id}
              className="surface-card flex flex-col overflow-hidden"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="block aspect-square w-full cursor-zoom-in bg-zinc-50"
                >
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-contain p-2"
                  />
                </button>

                <div className="pointer-events-none absolute left-2 top-2">
                  {available ? (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                      {p.inCar} шт
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                      Нет
                    </span>
                  )}
                </div>

                {available && (
                  <div className="absolute inset-x-1 bottom-1 flex items-center justify-between rounded-lg bg-white/95 shadow backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setQty(p, qty - 1)}
                      disabled={qty === 0}
                      className="flex size-7 items-center justify-center rounded-l-lg text-sm font-bold text-zinc-800 hover:bg-zinc-100 disabled:text-zinc-300"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold text-zinc-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(p, qty + 1)}
                      disabled={qty >= p.inCar}
                      className="flex size-7 items-center justify-center rounded-r-lg text-sm font-bold text-zinc-800 hover:bg-zinc-100 disabled:text-zinc-300"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-2">
                <span className="text-[10px] font-medium text-violet-700">
                  {p.categoryName}
                </span>
                <h2 className="mt-0.5 line-clamp-2 text-xs font-semibold">
                  {p.name}
                </h2>

                <div className="mt-1 flex items-end justify-between">
                  <strong className="text-sm">
                    {formatCurrency(p.price)}
                  </strong>
                  <span className="text-[10px] text-zinc-400">
                    {p.stock}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {viewerIndex !== null && (
        <FieldPhotoViewer
          products={filtered}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}