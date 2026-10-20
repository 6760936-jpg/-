"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartData = {
  date: string;
  current: number;
  previous: number;
};

export function FinanceChart({ data }: { data: ChartData[] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showShelves, setShowShelves] = useState(false);
  const [showStores, setShowStores] = useState(false);

  const filteredData = useMemo(() => {
    if (!startDate && !endDate) return data;
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  return (
    <div className="surface-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="font-semibold text-lg">Р’С‹СЂСѓС‡РєР°</h2>
        
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            <span>РЎ</span>
            <input type="date" className="input py-1.5" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            <span>РџРѕ</span>
            <input type="date" className="input py-1.5" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button onClick={() => { setStartDate(""); setEndDate(""); }} className="px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900">
            РЎР±СЂРѕСЃРёС‚СЊ
          </button>
          
          <div className="flex items-center gap-4 text-sm ml-4 border-l border-zinc-200 pl-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showShelves} onChange={e => setShowShelves(e.target.checked)} className="rounded border-zinc-300" />
              РџРѕР»РєРё
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showStores} onChange={e => setShowStores(e.target.checked)} className="rounded border-zinc-300" />
              РњР°РіР°Р·РёРЅС‹
            </label>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip
              formatter={(value: any) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(Number(value))}
              labelStyle={{ color: "#71717a", marginBottom: "4px" }}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Area type="monotone" name="Р’С‹СЂСѓС‡РєР°" dataKey="current" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
            
            {/* РџРѕР»РєРё */}
            {showShelves && (
              <Line type="monotone" name="РџРѕР»РєРё" dataKey="shelves" stroke="#10b981" strokeWidth={2} dot={false} />
            )}
            
            {/* РњР°РіР°Р·РёРЅС‹ */}
            {showStores && (
              <Line type="monotone" name="РњР°РіР°Р·РёРЅС‹" dataKey="stores" stroke="#f59e0b" strokeWidth={2} dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}