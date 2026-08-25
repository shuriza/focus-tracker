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
import { Info } from "lucide-react";
import type { DayBucket } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.find((item) => item.name === "totalMinutes")?.value ?? 0;
  const over = payload.find((item) => item.name === "overLimitMinutes")?.value ?? 0;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 text-xs shadow-lg shadow-blue-900/5 backdrop-blur-md">
      <p className="font-bold text-slate-700">{label}</p>
      <div className="mt-2 space-y-1">
        <p className="flex items-center gap-2 font-medium text-slate-900">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span>{total} menit tercatat</span>
        </p>
        {over > 0 && (
          <p className="flex items-center gap-2 font-medium text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>{over} menit di atas kuota</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function WeekChart({ data }: { data: DayBucket[] }) {
  const hasData = data.some((day) => day.totalMinutes > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="h-6 w-6 text-blue-500 mb-2" />
        <p className="font-semibold text-slate-700">Belum ada jejak 7 hari.</p>
        <p className="mt-1 text-xs max-w-sm">
          Pasang ekstensi Chrome, masuk dengan akun yang sama, lalu jelajahi web seperti biasa untuk melihat grafik.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="overFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit="m"
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="totalMinutes"
            name="totalMinutes"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill="url(#totalFill)"
          />
          <Area
            type="monotone"
            dataKey="overLimitMinutes"
            name="overLimitMinutes"
            stroke="#f43f5e"
            strokeWidth={2.5}
            fill="url(#overFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

