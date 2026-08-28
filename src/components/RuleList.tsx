import Link from "next/link";
import { Clock, Globe, Info, PencilLine, Power, PowerOff, Trash2 } from "lucide-react";
import { deleteRule, toggleRuleActive } from "@/app/actions/rules";
import { categoryColor, categoryLabel } from "@/lib/categories";
import type { Rule } from "@/lib/types";

export function RuleList({ rules }: { rules: Rule[] }) {
  if (rules.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="mb-1.5 h-5 w-5 text-blue-500" />
        <p className="font-semibold text-slate-700">Belum ada aturan kuota tersimpan.</p>
        <p className="mt-1 text-xs">
          Tambahkan domain yang paling sering menyita fokus kerjamu — seperti youtube.com, x.com, atau instagram.com.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      {rules.map((rule) => {
        const active = rule.active !== false;
        return (
          <li
            key={rule.id}
            className={`flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between ${active ? "" : "bg-slate-50/60 opacity-70"}`}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 sm:text-base">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>{rule.domain}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? "border border-emerald-100 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-600"}`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {active ? "Aktif" : "Nonaktif"}
                </span>
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
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {rule.time_limit_minutes} menit per hari
                </span>
                {scheduleLabel(rule) ? (
                  <>
                    <span>•</span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                      {scheduleLabel(rule)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/aturan?edit=${encodeURIComponent(rule.id)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Ubah
              </Link>

              <form action={toggleRuleActive}>
                <input type="hidden" name="id" value={rule.id} />
                <input type="hidden" name="active" value={String(!active)} />
                <button
                  type="submit"
                  aria-pressed={active}
                  title={active ? "Nonaktifkan aturan" : "Aktifkan aturan"}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95 ${active ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"}`}
                >
                  {active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  {active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>

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
            </div>
          </li>
        );
      })}
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
