/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
    __perspektivaLeafletPromise?: Promise<void>;
  }
}

function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
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
    const existing = document.querySelector<HTMLScriptElement>('script[data-perspektiva-leaflet="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Не удалось загрузить карту")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.perspektivaLeaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить карту"));
    document.head.appendChild(script);
  });
  return window.__perspektivaLeafletPromise;
}

export function LocationPicker({ initialLatitude = null, initialLongitude = null, required = true }: { initialLatitude?: number | null; initialLongitude?: number | null; required?: boolean }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const [latitude, setLatitude] = useState(initialLatitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialLongitude?.toString() ?? "");
  const [message, setMessage] = useState("Нажмите «Определить местоположение» или поставьте точку на карте.");

  function place(lat: number, lng: number, zoom = 16) {
    const latText = lat.toFixed(6);
    const lngText = lng.toFixed(6);
    setLatitude(latText);
    setLongitude(lngText);
    const L = window.L;
    if (!L || !mapInstance.current) return;
    if (!marker.current) {
      marker.current = L.circleMarker([lat, lng], { radius: 10, weight: 3, color: "#7c3aed", fillColor: "#7c3aed", fillOpacity: 0.35 }).addTo(mapInstance.current);
    } else marker.current.setLatLng([lat, lng]);
    mapInstance.current.setView([lat, lng], zoom);
  }

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then(() => {
      if (cancelled || !mapElement.current || mapInstance.current) return;
      const L = window.L;
      if (!L) return;
      const hasInitial = Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude);
      const center = hasInitial ? [initialLatitude, initialLongitude] : [55.75, 37.62];
      const map = L.map(mapElement.current, { zoomControl: true }).setView(center, hasInitial ? 16 : 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      map.on("click", (event: any) => {
        place(event.latlng.lat, event.latlng.lng, Math.max(map.getZoom(), 15));
        setMessage("Точка выбрана вручную. При необходимости нажмите в другое место.");
      });
      mapInstance.current = map;
      if (hasInitial) place(Number(initialLatitude), Number(initialLongitude), 16);
    }).catch(() => setMessage("Карта не загрузилась. Координаты можно ввести вручную ниже."));
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        marker.current = null;
      }
    };
  }, [initialLatitude, initialLongitude]);

  function detectLocation() {
    if (!navigator.geolocation) {
      setMessage("Браузер не поддерживает определение геопозиции. Поставьте точку вручную.");
      return;
    }
    setMessage("Определяем местоположение…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        place(position.coords.latitude, position.coords.longitude, 17);
        setMessage(`Местоположение определено с точностью около ${Math.round(position.coords.accuracy)} м. Проверьте точку на карте.`);
      },
      () => setMessage("Не удалось получить геопозицию. Разрешите доступ к местоположению или поставьте точку вручную."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  function manualChange(kind: "lat" | "lng", value: string) {
    const nextLat = kind === "lat" ? value : latitude;
    const nextLng = kind === "lng" ? value : longitude;
    if (kind === "lat") setLatitude(value); else setLongitude(value);
    const lat = Number(nextLat), lng = Number(nextLng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) place(lat, lng, 16);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><span className="field-label mb-1">Точка магазина на карте</span><p className="text-xs leading-5 text-zinc-500">Она используется водителем для маршрута и навигации.</p></div>
        <button type="button" onClick={detectLocation} className="button-secondary px-4 py-2.5">Определить местоположение</button>
      </div>
      <div ref={mapElement} className="h-64 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100" />
      <p className="text-xs leading-5 text-zinc-500">{message}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Широта</span><input className="input" name="latitude" type="number" step="any" value={latitude} onChange={(e) => manualChange("lat", e.target.value)} required={required} /></label>
        <label><span className="field-label">Долгота</span><input className="input" name="longitude" type="number" step="any" value={longitude} onChange={(e) => manualChange("lng", e.target.value)} required={required} /></label>
      </div>
    </div>
  );
}
