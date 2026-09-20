"use client";

import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const inCart = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const unavailable = product.stock <= 0 || inCart >= product.stock;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60">
      <div className="relative overflow-hidden bg-zinc-100">
        <ProductImage src={product.image} alt={product.name} className="aspect-square w-full transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.isSuperPrice && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Суперцена</span>}
          {product.isNew && <span className="rounded-full bg-violet-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Новинка</span>}
          {product.isHit && <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Хит</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 text-xs text-zinc-500"><span>{product.category.name}</span><span>{product.article}</span></div>
        <h2 className="mt-3 text-base font-semibold leading-snug text-zinc-950 sm:text-lg">{product.name}</h2>
        {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{product.description}</p>}
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4">
            <div>{product.oldPrice && product.oldPrice > product.price && <span className="block text-sm text-zinc-400 line-through">{formatCurrency(product.oldPrice)}</span>}<strong className="text-xl font-semibold text-zinc-950">{formatCurrency(product.price)}</strong></div>
            <span className={`text-xs font-semibold ${product.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>{product.stock > 0 ? `${product.stock} шт.` : "Нет в наличии"}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Минимум: {product.minOrder} шт.</p>
          <button type="button" disabled={unavailable} onClick={() => addItem(product)} className="button-primary mt-4 w-full">{product.stock <= 0 ? "Нет в наличии" : inCart > 0 ? `В корзине: ${inCart}` : "Добавить"}</button>
        </div>
      </div>
    </article>
  );
}
