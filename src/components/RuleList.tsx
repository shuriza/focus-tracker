import { Trash2, Clock, Globe, Info } from "lucide-react";
import { deleteRule } from "@/app/actions/rules";
import { categoryColor, categoryLabel } from "@/lib/categories";
import type { Rule } from "@/lib/types";

export function RuleList({ rules }: { rules: Rule[] }) {
  if (rules.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="h-5 w-5 text-blue-500 mb-1.5" />
        <p className="font-semibold text-slate-700">Belum ada kuota yang aktif.</p>
        <p className="mt-1 text-xs">
          Tambahkan domain yang paling sering menyita fokus kerjamu — seperti youtube.com, x.com, atau instagram.com.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
                <Globe className="h-4 w-4 text-blue-600" />
                <span>{rule.domain}</span>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: categoryColor(rule.category),
                  background: `${categoryColor(rule.category)}18`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: categoryColor(rule.category) }}
                />
                {categoryLabel(rule.category)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                {rule.time_limit_minutes} menit per hari
              </span>
              {scheduleLabel(rule) && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                    {scheduleLabel(rule)}
                  </span>
                </>
              )}
            </div>
          </div>
          <form action={deleteRule}>
            <input type="hidden" name="id" value={rule.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-transparent p-2 text-xs font-semibold text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer"
              title="Hapus aturan"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

function scheduleLabel(rule: Rule): string {
  const start = rule.active_start_hour;
  const end = rule.active_end_hour;
  if (start === null || end === null) return "";
  const fmt = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  return `Aktif ${fmt(start)}–${fmt(end)}`;
}