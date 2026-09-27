import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminMapClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта магазинов" };

export default async function AdminMapPage() {
  await requireAdmin();

  const [stores, lines, routes] = await Promise.all([
    prisma.store.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { routeLine: true, shelves: true },
      orderBy: { name: "asc" },
    }),
    prisma.routeLine.findMany({
      where: { active: true },
      orderBy: { title: "asc" },
    }),
    prisma.deliveryRoute.findMany({
      include: { line: true },
      orderBy: { routeDate: "desc" },
      take: 50,
    }),
  ]);

  const points = stores.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    settlement: s.settlement,
    phone: s.phone,
    latitude: s.latitude as number,
    longitude: s.longitude as number,
    debt: s.debt,
    notes: s.notes,
    lineId: s.routeLineId,
    lineTitle: s.routeLine?.title ?? null,
    needsReview: s.needsReview,
    hasShelf: s.shelves.length > 0,
  }));

  const routeOptions = routes.map((r) => ({
    id: r.id,
    title: r.title,
    lineId: r.lineId,
    lineTitle: r.line?.title ?? null,
    date: r.routeDate.toISOString().slice(0, 10),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div>
        <p className="eyebrow">Логистика</p>
        <h1 className="mt-2 text-3xl font-semibold">Карта магазинов</h1>
        <p className="mt-2 text-zinc-500">
          Все магазины на карте. Используйте фильтры.
        </p>
      </div>

      <AdminMapClient points={points} lines={lines} routes={routeOptions} />
    </div>
  );
}