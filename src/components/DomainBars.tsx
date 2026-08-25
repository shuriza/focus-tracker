"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import { categoryColor, categoryLabel } from "@/lib/categories";
import { formatDuration } from "@/lib/time";
import type { DomainUsage } from "@/lib/types";

export function DomainBars({ data }: { data: DomainUsage[] }) {
  const top = data.slice(0, 8).map((item) => ({
    ...item,
    minutes: Math.round(item.seconds / 60),
  }));

  if (top.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="h-6 w-6 text-blue-500 mb-2" />
        <p className="font-semibold text-slate-700">Tidak ada domain tercatat minggu ini.</p>
        <p className="mt-1 text-xs max-w-xs">
          Buka tab yang kamu pantau selama satu menit, lalu segarkan halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              unit="m"
            />
            <YAxis
              type="category"
              dataKey="domain"
              width={110}
              tick={{ fill: "#0f172a", fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value} menit`, "Durasi"]}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderColor: "#e2e8f0",
                borderRadius: 12,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                fontSize: 12,
                fontWeight: 500,
              }}
            />
            <Bar dataKey="minutes" radius={[0, 6, 6, 0]} maxBarSize={20}>
              {top.map((item) => (
                <Cell key={item.domain} fill={categoryColor(item.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-5 space-y-2.5 divide-y divide-slate-100 border-t border-slate-100 pt-3">
        {top.map((item) => (
          <li key={item.domain} className="flex items-center justify-between pt-2 text-xs">
            <span className="flex items-center gap-2 font-medium text-slate-800">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: categoryColor(item.category) }}
              />
              <span className="truncate max-w-[130px]">{item.domain}</span>
            </span>
            <span className="font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md">
              {formatDuration(item.seconds)}
              {item.limitMinutes ? ` / ${item.limitMinutes}m` : ""}
            </span>
          </li>
        ))}
      </ul>

      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
        {legendEntries(top).map(([label, color]) => (
          <li
            key={label}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function legendEntries(top: DomainUsage[]): [string, string][] {
  const seen = new Map<string, string>();
  for (const item of top) {
    const label = categoryLabel(item.category);
    if (!seen.has(label)) seen.set(label, categoryColor(item.category));
  }
  return [...seen.entries()];
}