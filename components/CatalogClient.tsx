/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

export function CatalogClient({ initialCategory = "all", initialQuery = "", initialTag = "all" }: { initialCategory?: string; initialQuery?: string; initialTag?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextCategory = searchParams.get("category") || "all";
    const nextQuery = searchParams.get("q") || "";
    const nextTag = searchParams.get("tag") || "all";
    setCategory(nextCategory);
    setQuery(nextQuery);
    setTag(nextTag);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/products", { cache: "no-store" }), fetch("/api/categories", { cache: "no-store" })])
      .then(async ([p, c]) => {
        if (!p.ok || !c.ok) throw new Error("Не удалось загрузить каталог");
        return Promise.all([p.json(), c.json()]);
      })
      .then(([p, c]) => {
        if (cancelled) return;
        setProducts((p as Product[]).filter((item) => item.active));
        setCategories((c as Category[]).filter((item) => item.active));
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  function updateUrl(next: { q?: string; category?: string; tag?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = { q: query, category, tag, ...next };
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") params.delete(key); else params.set(key, value);
    }
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const categoryMatch = category === "all" || product.categoryId === Number(category);
      const queryMatch = !normalized || [product.name, product.article, product.description ?? "", product.category.name].some((v) => v.toLowerCase().includes(normalized));
      const tagMatch = tag === "all" || (tag === "super" && product.isSuperPrice) || (tag === "new" && product.isNew) || (tag === "hit" && product.isHit);
      return categoryMatch && queryMatch && tagMatch;
    });
    return [...filtered].sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : sort === "stock" ? b.stock - a.stock : Number(b.isHit) - Number(a.isHit));
  }, [products, query, category, tag, sort]);

  return (
    <div className="container-page min-h-[70vh]">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="eyebrow">Оптовый ассортимент</p><h1 className="section-title mt-3">Каталог товаров</h1><p className="mt-3 max-w-2xl text-zinc-500">Актуальные остатки, минимальные партии и специальные цены для розничных точек.</p></div>
        <a href="/api/price-list" className="button-secondary">Скачать прайс-лист</a>
      </div>
      <div className="surface-card mb-8 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[1fr_240px_220px_220px]">
        <label><span className="field-label">Поиск</span><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} onBlur={() => updateUrl({ q: query })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); updateUrl({ q: query }); } }} placeholder="Название или артикул" /></label>
        <label><span className="field-label">Категория</span><select className="input" value={category} onChange={(e) => { const value=e.target.value; setCategory(value); updateUrl({ category: value }); }}><option value="all">Все категории</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><span className="field-label">Подборка</span><select className="input" value={tag} onChange={(e) => { const value=e.target.value; setTag(value); updateUrl({ tag: value }); }}><option value="all">Все товары</option><option value="super">Суперцены</option><option value="new">Новинки</option><option value="hit">Хиты</option></select></label>
        <label><span className="field-label">Сортировка</span><select className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="popular">Популярные</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="stock">Больше на складе</option></select></label>
      </div>
      <div className="mb-5 flex items-center justify-between"><span className="text-sm text-zinc-500">Найдено: {visible.length}</span><button className="text-sm font-semibold text-violet-700" onClick={() => { setQuery(""); setCategory("all"); setTag("all"); router.replace(pathname, { scroll: false }); }}>Сбросить фильтры</button></div>
      {loading && <div className="surface-card p-10 text-center text-zinc-500">Загрузка каталога...</div>}
      {error && <div className="alert-error">{error}</div>}
      {!loading && !error && visible.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
      {!loading && !error && visible.length === 0 && <div className="surface-card p-12 text-center"><h2 className="text-xl font-semibold">Товары не найдены</h2><p className="mt-2 text-zinc-500">Измените фильтры или поисковый запрос.</p></div>}
    </div>
  );
}
