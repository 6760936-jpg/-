"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    L?: any;
    __perspektivaMapPromise?: Promise<void>;
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
  needsReview: boolean;
  hasShelf: boolean;
};

type Line = { id: number; title: string };
type Route = {
  id: number;
  title: string;
  lineId: number | null;
  lineTitle: string | null;
  date: string;
};

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (window.__perspektivaMapPromise) return window.__perspektivaMapPromise;
  window.__perspektivaMapPromise = new Promise((resolve, reject) => {
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
  return window.__perspektivaMapPromise;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] ?? c),
  );
}

export function AdminMapClient({
  points,
  lines,
  routes,
}: {
  points: Point[];
  lines: Line[];
  routes: Route[];
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  const [lineFilter, setLineFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [onlyDebt, setOnlyDebt] = useState(false);
  const [onlyNoShelf, setOnlyNoShelf] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  const visible = useMemo(() => {
    return points.filter((p) => {
      if (lineFilter !== "all" && String(p.lineId) !== lineFilter) return false;
      if (onlyDebt && p.debt <= 0) return false;
      if (onlyNoShelf && p.hasShelf) return false;
      if (onlyNew && !p.needsReview) return false;
      return true;
    });
  }, [points, lineFilter, onlyDebt, onlyNoShelf, onlyNew]);

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

    for (const p of visible) {
      const color = "#7c3aed";
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 7,
        weight: 2,
        color,
        fillColor: color,
        fillOpacity: 0.6,
      });
      const debtText = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(p.debt);

      marker.bindPopup(
        `<div style="min-width:220px">
          <strong>${escapeHtml(p.name)}</strong>
          <div style="margin-top:4px">${escapeHtml(p.settlement ? p.settlement + ", " : "")}${escapeHtml(p.address)}</div>
          ${p.phone ? `<div style="margin-top:4px"><b>Тел:</b> <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div>` : ""}
          <div style="margin-top:6px"><b>Долг:</b> ${escapeHtml(debtText)}</div>
          ${p.lineTitle ? `<div><b>Линия:</b> ${escapeHtml(p.lineTitle)}</div>` : '<div style="color:#b45309"><b>Без линии</b></div>'}
          ${p.notes ? `<div style="margin-top:6px"><b>Примечание:</b> ${escapeHtml(p.notes)}</div>` : ""}
          <div style="margin-top:8px"><a href="/admin/stores/${p.id}" target="_blank">Открыть карточку →</a></div>
        </div>`,
      );
      marker.addTo(layerRef.current);
      bounds.push([p.latitude, p.longitude]);
    }

    if (bounds.length === 1) map.setView(bounds[0], 14);
    else if (bounds.length > 1)
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [visible]);

  const filteredRoutes = useMemo(() => {
    if (lineFilter === "all") return routes;
    return routes.filter((r) => String(r.lineId) === lineFilter);
  }, [routes, lineFilter]);

  return (
    <div className="mt-8 space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-48 flex-1">
          <span className="field-label">Линия</span>
          <select
            className="input"
            value={lineFilter}
            onChange={(e) => {
              setLineFilter(e.target.value);
              setRouteFilter("all");
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

        <label className="min-w-48 flex-1">
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

        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={onlyDebt}
            onChange={(e) => setOnlyDebt(e.target.checked)}
          />
          Только с долгом
        </label>

        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={onlyNoShelf}
            onChange={(e) => setOnlyNoShelf(e.target.checked)}
          />
          Без полки
        </label>

        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={onlyNew}
            onChange={(e) => setOnlyNew(e.target.checked)}
          />
          Новые
        </label>

        <span className="admin-chip mb-2">На карте: {visible.length}</span>
      </div>

      <div
        ref={mapEl}
        className="relative z-0 h-[70vh] min-h-[500px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
        style={{ zIndex: 0 }}
      />

      <div className="text-sm text-zinc-500">
        Клик по точке — информация о магазине.{" "}
        <Link href="/admin/stores" className="font-semibold text-violet-700">
          Перейти к списку →
        </Link>
      </div>
    </div>
  );
}