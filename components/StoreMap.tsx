"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
    __perspektivaLeafletPromise?: Promise<void>;
  }
}

export type StoreMapPoint = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  latitude: number;
  longitude: number;
  debt: number;
  notes?: string | null;
  lineId?: number | null;
  lineTitle?: string | null;
  today?: boolean;
  stopStatus?: string | null;
};

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (window.__perspektivaLeafletPromise) return window.__perspektivaLeafletPromise;
  window.__perspektivaLeafletPromise = new Promise((resolve, reject) => {
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
  return window.__perspektivaLeafletPromise;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char),
  );
}

export function StoreMap({
  stores,
  showTodayFilter = true,
  heightClass = "h-[62vh] min-h-[420px]",
}: {
  stores: StoreMapPoint[];
  showTodayFilter?: boolean;
  heightClass?: string;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const layer = useRef<any>(null);
  const [line, setLine] = useState("all");
  const [onlyToday, setOnlyToday] = useState(false);
  const [error, setError] = useState("");

  const lines = useMemo(
    () =>
      Array.from(
        new Map(
          stores
            .filter((s) => s.lineId)
            .map((s) => [
              String(s.lineId),
              s.lineTitle || `Линия ${s.lineId}`,
            ]),
        ).entries(),
      ),
    [stores],
  );

  const visible = useMemo(
    () =>
      stores.filter(
        (s) =>
          (line === "all" || String(s.lineId) === line) &&
          (!onlyToday || s.today),
      ),
    [stores, line, onlyToday],
  );

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet()
      .then(() => {
        if (cancelled || !mapElement.current || mapInstance.current) return;
        const L = window.L;
        const map = L.map(mapElement.current, { zoomControl: true }).setView(
          [55.75, 37.62],
          5,
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        layer.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
      })
      .catch(() =>
        setError(
          "Карта не загрузилась. Проверьте интернет-соединение; список магазинов ниже остаётся доступен.",
        ),
      );
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map || !layer.current) return;
    layer.current.clearLayers();
    const bounds: [number, number][] = [];
    for (const store of visible) {
      const done = store.stopStatus === "DONE";
      const color = done
        ? "#059669"
        : store.debt > 0
          ? "#dc2626"
          : store.today
            ? "#7c3aed"
            : "#27272a";
      const marker = L.circleMarker([store.latitude, store.longitude], {
        radius: store.today ? 9 : 7,
        weight: 2,
        color,
        fillColor: color,
        fillOpacity: 0.45,
      });
      const debt = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(store.debt);
      const routeUrl = `https://yandex.ru/maps/?rtext=~${store.latitude},${store.longitude}&rtt=auto`;
      marker.bindPopup(
        `<div style="min-width:220px"><strong>${escapeHtml(store.name)}</strong><div style="margin-top:5px">${escapeHtml(store.address)}</div>${store.phone ? `<div style="margin-top:5px"><b>Телефон:</b> <a href="tel:${escapeHtml(store.phone)}">${escapeHtml(store.phone)}</a></div>` : ""}<div style="margin-top:7px"><b>Долг:</b> ${escapeHtml(debt)}</div>${store.lineTitle ? `<div><b>Линия:</b> ${escapeHtml(store.lineTitle)}</div>` : ""}${store.notes ? `<div style="margin-top:6px"><b>Примечание:</b> ${escapeHtml(store.notes)}</div>` : ""}<div style="margin-top:10px"><a target="_blank" rel="noreferrer" href="${routeUrl}">Открыть маршрут →</a></div></div>`,
      );
      marker.addTo(layer.current);
      bounds.push([store.latitude, store.longitude]);
    }
    if (bounds.length === 1) map.setView(bounds[0], 16);
    else if (bounds.length > 1)
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [visible]);

  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-4 p-4">
        <label className="min-w-56 flex-1">
          <span className="field-label">Линия</span>
          <select
            className="input"
            value={line}
            onChange={(e) => setLine(e.target.value)}
          >
            <option value="all">Все линии и магазины</option>
            {lines.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        {showTodayFilter && (
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={onlyToday}
              onChange={(e) => setOnlyToday(e.target.checked)}
            />
            Только точки сегодняшних маршрутов
          </label>
        )}
        <span className="admin-chip mb-2">На карте: {visible.length}</span>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Карта — с пониженным z-index */}
      <div
        ref={mapElement}
        className={`${heightClass} relative z-0 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100`}
        style={{ zIndex: 0 }}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((store) => (
          <article key={store.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{store.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{store.address}</p>
                {store.phone && (
                  <a
                    className="mt-1 block text-xs font-semibold text-violet-700"
                    href={`tel:${store.phone}`}
                  >
                    {store.phone}
                  </a>
                )}
              </div>
              {store.today && (
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                  Сегодня
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span
                className={
                  store.debt > 0
                    ? "font-semibold text-rose-700"
                    : "text-zinc-500"
                }
              >
                Долг:{" "}
                {new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                }).format(store.debt)}
              </span>
              <a
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-violet-700"
                href={`https://yandex.ru/maps/?rtext=~${store.latitude},${store.longitude}&rtt=auto`}
              >
                Маршрут →
              </a>
            </div>
            {store.notes && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                {store.notes}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}