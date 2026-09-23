"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldCart } from "@/context/FieldCartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  article: string;
  price: number;
  image: string | null;
  categoryName: string;
  inCar: number;
};

export function FieldPhotoViewer({
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
  const { addItem, removeItem, items } = useFieldCart();

  const product = products[index];

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
  const available = product.inCar > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-zinc-950"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Верхняя панель — тонкая */}
      <div className="flex items-center justify-between px-3 py-1.5 text-white">
        <span className="text-xs text-zinc-400">
          {index + 1} / {products.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-white/10 text-base hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      {/* Фото */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {index > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ‹
          </button>
        )}

        <ProductImage
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
        />

        {index < products.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ›
          </button>
        )}
      </div>

      {/* Нижняя панель — тонкая, в одну строку */}
      <div className="border-t border-white/10 bg-zinc-900 px-3 py-2 text-white">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <strong className="truncate text-sm font-semibold">
                {product.name}
              </strong>
              <span className="shrink-0 text-xs text-zinc-400">
                {product.categoryName}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <strong className="text-sm">
                {formatCurrency(product.price)}
              </strong>
              <span className="text-zinc-400">
                {available ? `В машине: ${product.inCar}` : "Нет"}
              </span>
            </div>
          </div>

          {available && (
            <div className="flex shrink-0 items-center rounded-lg bg-white/10">
              <button
                type="button"
                onClick={() => setQty(product, qty - 1)}
                disabled={qty === 0}
                className="flex size-9 items-center justify-center rounded-l-lg text-lg font-bold hover:bg-white/10 disabled:text-zinc-600"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(product, qty + 1)}
                disabled={qty >= product.inCar}
                className="flex size-9 items-center justify-center rounded-r-lg text-lg font-bold hover:bg-white/10 disabled:text-zinc-600"
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