"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  const [period, setPeriod] = useState<"7" | "30" | "month">("7");
  const [showShelves, setShowShelves] = useState(false);
  const [showStores, setShowStores] = useState(false);

  // В зависимости от выбранного периода, берем нужное количество дней
  let visibleData = data;
  if (period === "7") visibleData = data.slice(-7);
  else if (period === "30") visibleData = data.slice(-30);
  else if (period === "month") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    visibleData = data.filter(d => new Date(d.date) >= monthStart);
  }

  return (
    <div className="surface-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="font-semibold text-lg">Выручка</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Периоды */}
          <div className="flex bg-zinc-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod("7")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${period === "7" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              7 дней
            </button>
            <button
              onClick={() => setPeriod("30")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${period === "30" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              30 дней
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${period === "month" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Этот месяц
            </button>
          </div>

          {/* Галочки */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showShelves} onChange={e => setShowShelves(e.target.checked)} className="rounded border-zinc-300" />
              Полки
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showStores} onChange={e => setShowStores(e.target.checked)} className="rounded border-zinc-300" />
              Магазины
            </label>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              formatter={(value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value)}
              labelStyle={{ color: "#71717a", marginBottom: "4px" }}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Area
              type="monotone"
              name="Выручка"
              dataKey="current"
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCurrent)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}