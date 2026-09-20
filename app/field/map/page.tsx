import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { StoreMap, type StoreMapPoint } from "@/components/StoreMap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта магазинов" };

export default async function FieldMapPage() {
  const user = await requireField();
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const end = new Date(start); end.setDate(end.getDate()+1);
  const [stores, routes] = await Promise.all([
    prisma.store.findMany({ where: { latitude: { not: null }, longitude: { not: null } }, include: { routeLine: true }, orderBy: [{ routeLineId:"asc" },{ routeOrder:"asc" },{ id:"asc" }] }),
    prisma.deliveryRoute.findMany({ where: { routeDate: { gte:start, lt:end }, ...(["FIELD","DRIVER"].includes(user.role) ? { assignedUserId:user.id } : {}) }, include: { stops:true } }),
  ]);
  const today = new Map<number,string>(); for (const route of routes) for (const stop of route.stops) today.set(stop.storeId, stop.status);
  const points: StoreMapPoint[] = stores.flatMap((store) => store.latitude === null || store.longitude === null ? [] : [{ id:store.id,name:store.name,address:store.address,phone:store.phone,latitude:store.latitude,longitude:store.longitude,debt:store.debt,notes:store.notes,lineId:store.routeLineId,lineTitle:store.routeLine?.title,today:today.has(store.id),stopStatus:today.get(store.id) ?? null }]);
  return <div className="container-page"><div className="mb-7"><p className="eyebrow">Логистика</p><h1 className="mt-2 text-3xl font-semibold">Карта всех магазинов</h1><p className="mt-2 max-w-3xl text-zinc-500">На карте отображаются все зарегистрированные точки с геолокацией. Можно отфильтровать линию или оставить только магазины сегодняшнего маршрута.</p></div><StoreMap stores={points} /></div>;
}
