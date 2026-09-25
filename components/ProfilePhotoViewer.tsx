"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  categoryName: string;
  stock: number;
  minOrder: number;
};

export function ProfilePhotoViewer({
  products,
  startIndex,
  onClose,
}: {
  products: Product[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const { addItem, removeItem, setQuantity, items } = useCart();

  const product = products[index];

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
    }
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIndex((i) => Math.min(products.length - 1, i + 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  }

  if (!product) return null;

  const qty = getQty(product.id);
  const available = product.stock > 0;
  const imgSrc = product.image || "/placeholder-product.svg";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-zinc-950"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-3 py-1.5 text-white">
        <span className="text-xs text-zinc-400">
          {index + 1} / {products.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-white/10 text-base hover:bg-white/20"
          aria-label="Закрыть"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {index > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
            aria-label="Предыдущий"
          >
            ‹
          </button>
        )}

        <img
          src={imgSrc}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />

        {index < products.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
            aria-label="Следующий"
          >
            ›
          </button>
        )}
      </div>

      <div className="border-t border-white/10 bg-zinc-900 px-4 py-3 text-white">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <strong className="truncate text-base font-semibold">
                {product.name}
              </strong>
              <span className="shrink-0 text-xs text-zinc-400">
                {product.categoryName}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <strong className="text-base">
                {formatCurrency(product.price)}
              </strong>
              <span className="text-xs text-zinc-400">
                {available ? `В наличии: ${product.stock}` : "Нет"}
              </span>
            </div>
          </div>

          {available && (
            <div className="flex shrink-0 items-center gap-6 rounded-xl bg-white/10 px-4 py-1">
              <button
                type="button"
                onClick={() => changeQty(product, qty - 1)}
                className="flex size-12 items-center justify-center rounded-lg text-3xl font-bold hover:bg-white/10"
                aria-label="Уменьшить"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center text-xl font-bold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => changeQty(product, qty + 1)}
                disabled={qty >= product.stock}
                className="flex size-12 items-center justify-center rounded-lg text-3xl font-bold hover:bg-white/10 disabled:text-zinc-600"
                aria-label="Увеличить"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}