import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/ProductImage";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, newProducts, hitProducts, promotions] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.product.findMany({ where: { active: true, isNew: true }, include: { category: true }, take: 4, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { active: true, OR: [{ isHit: true }, { isSuperPrice: true }] }, include: { category: true }, take: 4, orderBy: [{ isSuperPrice: "desc" }, { id: "desc" }] }),
    prisma.promotion.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 2 }),
  ]);

  return (
    <div>
      <section className="hero-grid overflow-hidden bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-20">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">Оптовые решения для розницы</span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">Товары для магазина, которые удобно закупать и выгодно продавать</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">ПЕРСПЕКТИВА объединяет оптовый ассортимент, актуальные остатки, специальные цены, доставку по маршрутам и обслуживание торговых точек.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/catalog" className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-violet-100">Открыть каталог</Link><Link href="/register" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10">Зарегистрировать магазин</Link></div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Ассортимент','Разные категории'],['В наличии','Актуальные остатки'],['Доставка','По постоянным линиям'],['Прайс','Всегда актуальный']].map(([a,b]) => <div key={a} className="rounded-2xl border border-white/10 bg-white/5 p-4"><strong className="block text-sm">{a}</strong><span className="mt-1 block text-xs text-zinc-400">{b}</span></div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(promotions.length ? promotions : [{ id: 1, title: "Суперцены", subtitle: "Специальные позиции", badge: "ВЫГОДНО", image: "/promo/promo-car.svg" }, { id: 2, title: "Готовая товарная полка", subtitle: "Стартовый ассортимент", badge: "РЕШЕНИЕ", image: "/promo/promo-shelf.svg" }]).map((promotion, index) => (
              <Link key={promotion.id} href={index === 0 ? "/catalog?tag=super" : "/catalog"} className={`group relative overflow-hidden rounded-[2rem] border border-white/10 ${index === 0 ? "sm:translate-y-8" : ""}`}>
                <ProductImage src={promotion.image} alt={promotion.title} className="aspect-[4/5] w-full opacity-90 transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-6 pt-20"><span className="text-xs font-semibold tracking-wider text-violet-200">{promotion.badge}</span><h2 className="mt-2 text-2xl font-semibold">{promotion.title}</h2><p className="mt-2 text-sm text-zinc-300">{promotion.subtitle}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Категории</p><h2 className="section-title mt-3">Подберите ассортимент для своей торговой точки</h2></div><Link href="/catalog" className="hidden text-sm font-semibold text-violet-700 sm:block">Весь каталог →</Link></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => <Link key={category.id} href={`/catalog?category=${category.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-1 hover:shadow-xl"><ProductImage src={category.image} alt={category.name} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" /><div className="p-5"><h3 className="text-lg font-semibold">{category.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{category.description}</p><span className="mt-4 block text-sm font-semibold text-violet-700">{category._count.products} товаров →</span></div></Link>)}
        </div>
      </section>

      {hitProducts.length > 0 && <section className="border-y border-zinc-200 bg-white"><div className="container-page py-14 sm:py-20"><div className="flex items-end justify-between"><div><p className="eyebrow">Выгодное предложение</p><h2 className="section-title mt-3">Хиты и суперцены</h2></div><Link className="text-sm font-semibold text-violet-700" href="/catalog?tag=super">Смотреть все →</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{hitProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>}

      {newProducts.length > 0 && <section className="container-page py-14 sm:py-20"><div className="flex items-end justify-between"><div><p className="eyebrow">Свежий ассортимент</p><h2 className="section-title mt-3">Новинки</h2></div><Link className="text-sm font-semibold text-violet-700" href="/catalog?tag=new">Смотреть все →</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{newProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}

      <section className="container-page pb-8"><div className="overflow-hidden rounded-[2rem] bg-violet-700 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Для новых магазинов</p><h2 className="mt-3 text-3xl font-semibold">Подключите свою торговую точку</h2><p className="mt-3 max-w-2xl text-violet-100">При регистрации укажите адрес и точку магазина на карте. Это поможет правильно привязать доставку и будущий маршрут.</p></div><Link href="/register" className="mt-6 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-violet-800 lg:mt-0">Зарегистрировать магазин</Link></div></section>
    </div>
  );
}
