"use client";

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
  return (
    <div className="surface-card p-6">
      <h2 className="font-semibold text-lg mb-6">Выручка за последние 7 дней</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
              name="Текущая неделя"
              dataKey="current"
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCurrent)"
            />
            <Area
              type="monotone"
              name="Прошлая неделя"
              dataKey="previous"
              stroke="#a1a1aa"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-6 mt-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-600"></span>
          <span className="text-zinc-600">Текущая неделя</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-zinc-400"></span>
          <span className="text-zinc-600">Прошлая неделя</span>
        </div>
      </div>
    </div>
  );
}