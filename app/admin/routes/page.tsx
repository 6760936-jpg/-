import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { RoutesClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Р›РёРЅРёРё Рё РјР°СЂС€СЂСѓС‚С‹" };

export default async function RoutesPage() {
  await requireAdmin();

  const [stores, lines, users, routes] = await Promise.all([
    prisma.store.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { routeLine: true, shelves: true },
      orderBy: { name: "asc" },
    }),
    prisma.routeLine.findMany({ orderBy: { title: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["DRIVER", "FIELD"] }, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.deliveryRoute.findMany({
      include: {
        assignedUser: true,
        line: true,
        stops: { orderBy: { sequence: "asc" }, include: { store: true } },
      },
      orderBy: { routeDate: "desc" },
      take: 20,
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
    hasShelf: s.shelves.length > 0,
  }));

  const lineOptions = lines.map((l) => ({ id: l.id, title: l.title }));
  const driverOptions = users.map((u) => ({ id: u.id, name: u.name }));

  const routeOptions = routes.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.routeDate.toISOString().slice(0, 10),
    status: r.status,
    lineId: r.lineId,
    lineTitle: r.line?.title ?? null,
    driverId: r.assignedUserId,
    driverName: r.assignedUser?.name ?? null,
    stopsCount: r.stops.length,
    storeIds: r.stops.map((s) => s.storeId),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <RoutesClient
        points={points}
        lines={lineOptions}
        drivers={driverOptions}
        routes={routeOptions}
      />
    </div>
  );
}