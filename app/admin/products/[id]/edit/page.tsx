"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Product } from "@/lib/types";
import { ProductForm } from "@/components/ProductForm";
export default function EditProductPage() {
  const params = useParams<{ id: string }>(); const [product, setProduct] = useState<Product | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/products/${params.id}`, { cache: "no-store" }).then(async (r) => { if (!r.ok) { const b = await r.json() as { error?: string }; throw new Error(b.error || "Товар не найден"); } return r.json() as Promise<Product>; }).then(setProduct).catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка загрузки")); }, [params.id]);
  return <div className="p-4 sm:p-6 lg:p-10"><div className="mb-8"><p className="eyebrow">Ассортимент</p><h1 className="mt-2 text-3xl font-semibold">Редактирование товара</h1></div>{error && <div className="alert-error">{error}</div>}{!error && !product && <div className="surface-card p-8 text-zinc-500">Загрузка товара...</div>}{product && <ProductForm product={product} />}</div>;
}
