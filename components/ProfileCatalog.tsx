"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";
import { ProfilePhotoViewer } from "@/components/ProfilePhotoViewer";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  minOrder: number;
  categoryId: number;
  categoryName?: string;
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === null
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  function getQty(productId: number) {
    return items.find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  function changeQty(p: Product, next: number) {
    const min = p.minOrder || 1;
    const current = getQty(p.id);

    if (current === 0 && next > 0) {
      const start = Math.min(min, p.stock);
      addItem(p as any);
      if (start !== 1) {
        setQuantity(p.id, start);
      }
      return;
    }

    if (next < current) {
      if (current <= min) {
        removeItem(p.id);
        return;
      }
      setQuantity(p.id, Math.max(next, min));
      return;
    }

    if (next > current) {
      setQuantity(p.id, Math.min(next, p.stock));
      return;
    }
  }

  // Для просмотрщика — добавим категорию
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const viewerProducts = filtered.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    stock: p.stock,
    categoryName: categoryMap.get(p.categoryId) ?? "",
  }));

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
          {filtered.map((p, index) => {
            const available = p.stock > 0;
            const qty = getQty(p.id);
            const min = p.minOrder || 1;

            return (
              <div
                key={p.id}
                className="surface-card flex flex-col p-4 transition hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="mb-3 flex h-32 cursor-zoom-in items-center justify-center rounded-xl bg-zinc-50 transition hover:bg-zinc-100"
                  aria-label={`Открыть фото ${p.name}`}
                >
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    className="h-24 w-24 object-contain"
                  />
                </button>

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
                  {available ? `${p.stock} шт · мин. ${min}` : "Ожидается"}
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
                    <span className="w-full text-center text-base font-semibold">
                      {qty}
                    </span>
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

      {viewerIndex !== null && (
        <ProfilePhotoViewer
          products={viewerProducts}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}