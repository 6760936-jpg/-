"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { assignStoreAction, changeRouteDriverAction } from "@/lib/admin-actions";

declare global {
  interface Window {
    L?: any;
    __perspektivaRoutesMap?: Promise<void>;
  }
}

type Point = {
  id: number;
  name: string;
  address: string;
  settlement: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  debt: number;
  notes: string | null;
  lineId: number | null;
  lineTitle: string | null;
  hasShelf: boolean;
};

type Line = { id: number; title: string };
type Driver = { id: number; name: string };
type Route = {
  id: number;
  title: string;
  date: string;
  status: string;
  lineId: number | null;
  lineTitle: string | null;
  driverId: number | null;
  driverName: string | null;
  stopsCount: number;
  storeIds: number[];
};

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (window.__perspektivaRoutesMap) return window.__perspektivaRoutesMap;
  window.__perspektivaRoutesMap = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-perspektiva-leaflet="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.perspektivaLeaflet = "1";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.perspektivaLeaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Карта недоступна"));
    document.head.appendChild(script);
  });
  return window.__perspektivaRoutesMap;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] ?? c),
  );
}

export function RoutesClient({
  points,
  lines,
  drivers,
  routes,
}: {
  points: Point[];
  lines: Line[];
  drivers: Driver[];
  routes: Route[];
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [mapReady, setMapReady] = useState(false);

  const visible = useMemo(() => {
    return points.filter((p) => {
      if (lineFilter !== "all" && String(p.lineId) !== lineFilter) return false;
      if (routeFilter !== "all") {
        const route = routes.find((r) => String(r.id) === routeFilter);
        if (!route) return false;
        if (!route.storeIds.includes(p.id)) return false;
      }
      if (driverFilter !== "all") {
        const driverRoutes = routes.filter((r) => String(r.driverId) === driverFilter);
        const allowed = new Set<number>();
        for (const r of driverRoutes) for (const id of r.storeIds) allowed.add(id);
        if (!allowed.has(p.id)) return false;
      }
      return true;
    });
  }, [points, lineFilter, routeFilter, driverFilter, routes]);

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet()
      .then(() => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const L = window.L;
        const map = L.map(mapEl.current).setView([55.75, 37.62], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setTimeout(() => {
          map.invalidateSize();
          setMapReady(true);
        }, 100);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !layerRef.current) return;
    layerRef.current.clearLayers();
    const bounds: [number, number][] = [];

    setTimeout(() => map.invalidateSize(), 50);

    for (const p of visible) {
      const color = p.lineId ? "#7c3aed" : "#f59e0b";
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 10,
        weight: 3,
        color,
        fillColor: color,
        fillOpacity: 0.85,
      });

      const debtText = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(p.debt);

      const lineOptionsHtml = lines
        .map(
          (l) =>
            `<option value="${l.id}" ${p.lineId === l.id ? "selected" : ""}>${escapeHtml(l.title)}</option>`,
        )
        .join("");

      const routeOptionsHtml = routes
        .map((r) => `<option value="${r.id}">${escapeHtml(r.date)} · ${escapeHtml(r.title)}</option>`)
        .join("");

      marker.bindPopup(
        `<div style="min-width:260px">
          <strong>${escapeHtml(p.name)}</strong>
          <div style="margin-top:4px">${escapeHtml(p.settlement ? p.settlement + ", " : "")}${escapeHtml(p.address)}</div>
          ${p.phone ? `<div style="margin-top:4px"><b>Тел:</b> <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div>` : ""}
          <div style="margin-top:6px"><b>Долг:</b> ${escapeHtml(debtText)}</div>
          ${p.lineTitle ? `<div><b>Линия:</b> ${escapeHtml(p.lineTitle)}</div>` : '<div style="color:#b45309"><b>Без линии</b></div>'}

          <div style="margin-top:10px"><b>Линия:</b></div>
          <select id="line-sel-${p.id}" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:6px;margin-top:2px">
            <option value="">— Без линии —</option>
            ${lineOptionsHtml}
          </select>

          <div style="margin-top:8px"><b>Добавить в маршрут:</b></div>
          <select id="route-sel-${p.id}" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:6px;margin-top:2px">
            <option value="">— Не добавлять —</option>
            ${routeOptionsHtml}
          </select>

          <div style="margin-top:8px"><b>Населённый пункт:</b></div>
          <input id="settlement-inp-${p.id}" type="text" value="${escapeHtml(p.settlement ?? "")}" placeholder="Например, Индерей" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:6px;margin-top:2px" />

          <div style="margin-top:10px;display:flex;gap:6px">
            <button type="button" onclick="window.__assignLine(${p.id})" style="flex:1;background:#7c3aed;color:white;padding:6px 10px;border:none;border-radius:6px;font-weight:600;cursor:pointer">Сохранить</button>
            <a href="/admin/stores/${p.id}" target="_blank" style="flex:1;text-align:center;background:#f4f4f5;color:#111;padding:6px 10px;border-radius:6px;font-weight:600;text-decoration:none">Карточка</a>
          </div>
        </div>`,
      );
      marker.addTo(layerRef.current);
      bounds.push([p.latitude, p.longitude]);
    }

    setTimeout(() => {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
      } else {
        map.setView([55.75, 37.62], 5);
      }
      map.invalidateSize();
    }, 100);
  }, [visible, lines, routes, mapReady]);

  useEffect(() => {
    (window as any).__assignLine = async (storeId: number) => {
      const lineSel = document.getElementById(`line-sel-${storeId}`) as HTMLSelectElement | null;
      const routeSel = document.getElementById(`route-sel-${storeId}`) as HTMLSelectElement | null;
      const settlementInp = document.getElementById(`settlement-inp-${storeId}`) as HTMLInputElement | null;

      const form = new FormData();
      form.set("storeId", String(storeId));
      form.set("lineId", lineSel?.value ?? "");
      form.set("routeId", routeSel?.value ?? "");
      form.set("settlement", settlementInp?.value ?? "");

      await assignStoreAction(form);
      window.location.href = "/admin/routes";
    };
    return () => {
      delete (window as any).__assignLine;
    };
  }, []);

  const filteredRoutes = useMemo(() => {
    if (lineFilter === "all") return routes;
    return routes.filter((r) => String(r.lineId) === lineFilter);
  }, [routes, lineFilter]);

  const filteredDrivers = useMemo(() => {
    if (routeFilter === "all") return drivers;
    const route = routes.find((r) => String(r.id) === routeFilter);
    if (!route || !route.driverId) return drivers;
    return drivers.filter((d) => d.id === route.driverId);
  }, [drivers, routes, routeFilter]);

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-44 flex-1">
          <span className="field-label">Линия</span>
          <select
            className="input"
            value={lineFilter}
            onChange={(e) => {
              setLineFilter(e.target.value);
              setRouteFilter("all");
              setDriverFilter("all");
            }}
          >
            <option value="all">Все линии</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-44 flex-1">
          <span className="field-label">Маршрут</span>
          <select
            className="input"
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
          >
            <option value="all">Все маршруты</option>
            {filteredRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.date} · {r.title}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-44 flex-1">
          <span className="field-label">Водитель</span>
          <select
            className="input"
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
          >
            <option value="all">Все водители</option>
            {filteredDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <span className="admin-chip mb-2">На карте: {visible.length}</span>

        <Link href="/admin/routes/new-line" className="button-secondary">
          + Линия
        </Link>
        <Link
          href="/admin/routes/new-route"
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          + Маршрут
        </Link>
      </div>

      <div
        ref={mapEl}
        className="relative z-0 h-[60vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
        style={{ zIndex: 0 }}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-3 font-semibold">Линии ({lines.length})</h2>
          <div className="divide-y divide-zinc-100">
            {lines.map((l) => {
              const count = points.filter((p) => p.lineId === l.id).length;
              return (
                <Link
                  key={l.id}
                  href={`/admin/routes/${l.id}/line`}
                  className="flex items-center justify-between gap-3 py-2 text-sm hover:text-violet-700"
                >
                  <span className="truncate font-medium">{l.title}</span>
                  <span className="shrink-0 text-zinc-500">{count} магазинов →</span>
                </Link>
              );
            })}
            {lines.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">Линий пока нет.</p>
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="mb-3 font-semibold">Маршруты ({routes.length})</h2>
          <div>
            {routes.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 py-3 text-sm last:border-b-0"
              >
                <Link
                  href={`/admin/routes/${r.id}/route`}
                  className="min-w-0 flex-1 hover:text-violet-700"
                >
                  <strong className="block">{r.title}</strong>
                  <span className="text-xs text-zinc-500">
                    {r.date} · {r.lineTitle ?? "без линии"} · {r.stopsCount} точек →
                  </span>
                </Link>
                <form
                  action={changeRouteDriverAction}
                  className="flex shrink-0 items-center gap-2"
                >
                  <input type="hidden" name="routeId" value={r.id} />
                  <select
                    className="input w-44"
                    name="driverId"
                    defaultValue={r.driverId ?? ""}
                  >
                    <option value="">Без водителя</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <button className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">
                    Сохранить
                  </button>
                </form>
              </div>
            ))}
            {routes.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">Маршрутов пока нет.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}