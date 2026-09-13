"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { saveFocusBudget, type BudgetActionState } from "@/app/actions/focus-budget";

const initial: BudgetActionState = { error: null, saved: false };

export function BudgetForm({ budgetMinutes }: { budgetMinutes: number | null }) {
  const [state, action, pending] = useActionState(saveFocusBudget, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="daily_budget_minutes"
          className="block text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          Anggaran fokus per hari
        </label>
        <div className="relative max-w-xs">
          <input
            id="daily_budget_minutes"
            name="daily_budget_minutes"
            type="number"
            min={15}
            max={1440}
            step={5}
            defaultValue={budgetMinutes ?? ""}
            aria-describedby="daily_budget_minutes_hint"
            placeholder="Contoh: 240"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
            mnt
          </span>
        </div>
        <p id="daily_budget_minutes_hint" className="text-xs leading-relaxed text-slate-500">
          Kosongkan input ini untuk mematikan anggaran harian.
        </p>
      </div>

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <p className="leading-relaxed">{state.error}</p>
        </div>
      ) : null}

      {state.saved ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="leading-relaxed">Anggaran fokus harian telah disimpan.</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {pending ? "Menyimpan…" : "Simpan anggaran"}
      </button>
    </form>
  );
}
