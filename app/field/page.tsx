import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FieldPage() {
  const user = await requireField();
  const where = ["FIELD", "DRIVER"].includes(user.role) ? { assignedUserId: user.id } : {};
  const routes = await prisma.deliveryRoute.findMany({ where, include: { line: true, stops: { include: { store: true, order: { include: { items: true } } }, orderBy: { sequence: "asc" } } }, orderBy: { routeDate: "asc" } });
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const end = new Date(start); end.setDate(end.getDate()+1);
  const todayRoutes = routes.filter((route) => route.routeDate >= start && route.routeDate < end);
  const visibleRoutes = todayRoutes.length ? todayRoutes : routes;
  return <div className="container-page max-w-6xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Рабочий кабинет</p><h1 className="mt-2 text-3xl font-semibold">Маршруты и торговые точки</h1><p className="mt-2 text-zinc-500">Сегодняшние доставки, долги, комментарии и навигация по магазинам.</p></div><div className="flex gap-2"><Link href="/field/map" className="button-primary">Карта всех магазинов</Link><Link href="/field/catalog" className="button-secondary">Товар в наличии</Link></div></div>
    <div className="mt-8 space-y-6">{visibleRoutes.map((route) => <section key={route.id} className="surface-card overflow-hidden"><div className="border-b border-zinc-200 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{route.title}</h2><p className="mt-1 text-sm text-zinc-500">{new Intl.DateTimeFormat("ru-RU", { dateStyle:"long" }).format(route.routeDate)}{route.line ? ` · ${route.line.title}` : ""}</p></div><span className="admin-chip">{route.stops.filter((s) => s.status === "DONE").length}/{route.stops.length} выполнено</span></div></div><div className="divide-y divide-zinc-100">{route.stops.map((stop) => <Link key={stop.id} href={`/field/stops/${stop.id}`} className="grid gap-4 p-5 transition hover:bg-violet-50 sm:grid-cols-[48px_1fr_auto] sm:items-center"><span className={`grid size-11 place-items-center rounded-xl font-semibold ${stop.status === "DONE" ? "bg-emerald-600 text-white" : "bg-zinc-950 text-white"}`}>{stop.sequence}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{stop.store.name}</h3>{stop.store.debt > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Долг {formatCurrency(stop.store.debt)}</span>}</div><p className="mt-1 text-sm text-zinc-500">{stop.store.address}</p><p className="mt-2 text-xs text-zinc-400">{stop.order ? `${stop.order.items.reduce((s,i)=>s+i.quantity,0)} единиц к выгрузке` : "Визит без заказа"}</p>{stop.store.notes && <p className="mt-2 text-xs font-medium text-amber-700">{stop.store.notes}</p>}</div><span className="text-sm font-semibold text-violet-700">Открыть →</span></Link>)}</div></section>)}{visibleRoutes.length === 0 && <div className="surface-card p-10 text-center text-zinc-500">Назначенных маршрутов пока нет. Все зарегистрированные магазины доступны на карте.</div>}</div>
  </div>;
}
