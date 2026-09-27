"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { assignStoreAction } from "@/lib/admin-actions";

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
  const [mapReady, setMapReady] = useState(false);

  const visible = useMemo(() => {
    if (lineFilter === "all") return points;
    return points.filter((p) => String(p.lineId) === lineFilter);
  }, [points, lineFilter]);

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

      marker.bindPopup(
        `<div style="min-width:240px">
          <strong>${escapeHtml(p.name)}</strong>
          <div style="margin-top:4px">${escapeHtml(p.settlement ? p.settlement + ", " : "")}${escapeHtml(p.address)}</div>
          ${p.phone ? `<div style="margin-top:4px"><b>Тел:</b> <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div>` : ""}
          <div style="margin-top:6px"><b>Долг:</b> ${escapeHtml(debtText)}</div>
          ${p.lineTitle ? `<div><b>Линия:</b> ${escapeHtml(p.lineTitle)}</div>` : '<div style="color:#b45309"><b>Без линии</b></div>'}
          <div style="margin-top:8px"><b>Назначить линию:</b></div>
          <div style="margin-top:4px">
            <select id="line-sel-${p.id}" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:6px">
              <option value="">— Без линии —</option>
              ${lineOptionsHtml}
            </select>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px">
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
  }, [visible, lines, mapReady]);

  useEffect(() => {
    (window as any).__assignLine = async (storeId: number) => {
      const sel = document.getElementById(`line-sel-${storeId}`) as HTMLSelectElement | null;
      if (!sel) return;
      const lineId = sel.value;
      const form = new FormData();
      form.set("storeId", String(storeId));
      form.set("lineId", lineId);
      await assignStoreAction(form);
      window.location.reload();
    };
    return () => {
      delete (window as any).__assignLine;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-56 flex-1">
          <span className="field-label">Линия</span>
          <select
            className="input"
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
          >
            <option value="all">Все линии</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <span className="admin-chip mb-2">На карте: {visible.length}</span>
        <Link href="/admin/routes/new-line" className="button-secondary">
          + Линия
        </Link>
        <Link href="/admin/routes/new-route" className="button-primary">
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
                <div key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate font-medium">{l.title}</span>
                  <span className="shrink-0 text-zinc-500">{count} магазинов</span>
                </div>
              );
            })}
            {lines.length === 0 && (
              <p className="py-3 text-sm text-zinc-500">Линий пока нет.</p>
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="mb-3 font-semibold">Маршруты ({routes.length})</h2>
          <div className="divide-y divide-zinc-100">
            {routes.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <strong className="block">{r.title}</strong>
                  <span className="text-xs text-zinc-500">
                    {r.date} · {r.lineTitle ?? "без линии"} · {r.driverName ?? "без водителя"}
                  </span>
                </span>
                <span className="shrink-0 text-zinc-500">{r.stopsCount} точек</span>
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