import { Info } from "lucide-react";
import { categoryColor } from "@/lib/categories";
import { formatDuration } from "@/lib/time";
import type { TodayDomain } from "@/lib/types";

export function TodayProgress({ data }: { data: TodayDomain[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="h-5 w-5 text-blue-500 mb-1.5" />
        <p className="font-semibold text-slate-700">Belum ada aktivitas tercatat hari ini.</p>
        <p className="mt-1 text-xs">Buka situs yang dipantau lalu tunggu sinkronisasi dari ekstensi.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => {
        const percentage = Math.min(100, Math.round(item.ratio * 100));
        return (
          <li
            key={item.domain}
            className={`rounded-xl border p-4 transition ${
              item.over
                ? "border-rose-200 bg-rose-50/30"
                : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900 truncate">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: categoryColor(item.category) }}
                />
                <span className="truncate">{item.domain}</span>
              </span>
              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200/70 shadow-2xs">
                {formatDuration(item.seconds)}
                {item.limitMinutes ? ` / ${item.limitMinutes}m` : ""}
              </span>
            </div>

            {item.limitMinutes ? (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.over ? "bg-rose-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">{percentage}% terpakai</span>
                  <span
                    className={`font-semibold ${
                      item.over ? "text-rose-600" : "text-slate-600"
                    }`}
                  >
                    {item.over
                      ? `Over ${formatDuration(item.seconds - item.limitMinutes * 60)}`
                      : `Sisa ${formatDuration(item.remainingSeconds)}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Tanpa batas kuota</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
                  Bebas
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}