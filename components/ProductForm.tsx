"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiError, Category, Product, ProductFormValues } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";

const emptyValues: ProductFormValues = {
  name: "", article: "", price: "", oldPrice: "", purchasePrice: "", stock: "0", minOrder: "1",
  description: "", categoryId: "", image: "", isNew: false, isHit: false, isSuperPrice: false, active: true,
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<ProductFormValues>(() => product ? {
    name: product.name, article: product.article, price: String(product.price), oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
    purchasePrice: String(product.purchasePrice), stock: String(product.stock), minOrder: String(product.minOrder), description: product.description ?? "",
    categoryId: String(product.categoryId), image: product.image ?? "", isNew: product.isNew, isHit: product.isHit,
    isSuperPrice: product.isSuperPrice, active: product.active,
  } : emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) throw new Error("Не удалось загрузить категории");
      return (await r.json()) as Category[];
    }).then(setCategories).catch((e: unknown) => setMessage(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  function setField<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true); setMessage("");
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !result.path) throw new Error(result.error || "Ошибка загрузки файла");
      setField("image", result.path);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка загрузки файла"); }
    finally { setUploading(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage(""); setErrors({});
    try {
      const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          price: Number(values.price), oldPrice: values.oldPrice ? Number(values.oldPrice) : null,
          purchasePrice: Number(values.purchasePrice), stock: Number(values.stock), minOrder: Number(values.minOrder),
          categoryId: Number(values.categoryId),
        }),
      });
      const result = (await response.json()) as Product | ApiError;
      if (!response.ok) { const apiError = result as ApiError; setErrors(apiError.details ?? {}); throw new Error(apiError.error || "Не удалось сохранить товар"); }
      router.push("/admin/products"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить товар"); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="surface-card space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Название" error={errors.name} className="sm:col-span-2"><input className="input" value={values.name} onChange={(e) => setField("name", e.target.value)} required /></Field>
          <Field label="Артикул" error={errors.article}><input className="input uppercase" value={values.article} onChange={(e) => setField("article", e.target.value.toUpperCase())} required /></Field>
          <Field label="Категория" error={errors.categoryId}><select className="input" value={values.categoryId} onChange={(e) => setField("categoryId", e.target.value)} required><option value="">Выберите категорию</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Цена продажи, ₽" error={errors.price}><input className="input" type="number" min="0" step="0.01" value={values.price} onChange={(e) => setField("price", e.target.value)} required /></Field>
          <Field label="Старая цена, ₽" error={errors.oldPrice}><input className="input" type="number" min="0" step="0.01" value={values.oldPrice} onChange={(e) => setField("oldPrice", e.target.value)} /></Field>
          <Field label="Закупочная цена, ₽" error={errors.purchasePrice}><input className="input" type="number" min="0" step="0.01" value={values.purchasePrice} onChange={(e) => setField("purchasePrice", e.target.value)} required /></Field>
          <Field label="Остаток" error={errors.stock}><input className="input" type="number" min="0" step="1" value={values.stock} onChange={(e) => setField("stock", e.target.value)} required /></Field>
          <Field label="Минимальный заказ" error={errors.minOrder}><input className="input" type="number" min="1" step="1" value={values.minOrder} onChange={(e) => setField("minOrder", e.target.value)} required /></Field>
          <Field label="Описание" error={errors.description} className="sm:col-span-2"><textarea className="input min-h-36 resize-y" value={values.description} onChange={(e) => setField("description", e.target.value)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Check label="Новинка" checked={values.isNew} onChange={(v) => setField("isNew", v)} />
          <Check label="Хит" checked={values.isHit} onChange={(v) => setField("isHit", v)} />
          <Check label="Суперцена" checked={values.isSuperPrice} onChange={(v) => setField("isSuperPrice", v)} />
          <Check label="Показывать" checked={values.active} onChange={(v) => setField("active", v)} />
        </div>
        {message && <div className="alert-error">{message}</div>}
        <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-6">
          <button type="submit" disabled={submitting || uploading} className="button-primary">{submitting ? "Сохранение..." : product ? "Сохранить" : "Создать товар"}</button>
          <button type="button" onClick={() => router.push("/admin/products")} className="button-secondary">Отмена</button>
        </div>
      </div>
      <aside className="surface-card h-fit p-6">
        <h2 className="font-semibold text-zinc-950">Фотография товара</h2>
        <p className="mt-1 text-sm text-zinc-500">JPG, PNG или WEBP до 5 МБ.</p>
        <ProductImage src={values.image} alt="Предпросмотр" className="mt-5 aspect-square w-full rounded-2xl" />
        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-zinc-300 px-4 py-4 text-center text-sm font-semibold hover:bg-zinc-50">{uploading ? "Загрузка..." : "Загрузить фото"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(e) => void handleUpload(e.target.files?.[0])} /></label>
        {values.image && <button type="button" className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={() => setField("image", "")}>Удалить фото</button>}
      </aside>
    </form>
  );
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="field-label">{label}</span>{children}{error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}</label>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
