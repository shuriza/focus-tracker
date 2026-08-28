"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Calendar, Globe, Plus } from "lucide-react";
import { createRule, type RuleActionState } from "@/app/actions/rules";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/categories";
import type { RulePreset } from "@/lib/presets";
import type { Rule } from "@/lib/types";

const initial: RuleActionState = { error: null };

export function RuleForm({
  editRule = null,
  preset = null,
}: {
  editRule?: Rule | null;
  preset?: RulePreset | null;
}) {
  const [state, action, pending] = useActionState(createRule, initial);
  const domain = editRule?.domain ?? preset?.domain ?? "";
  const timeLimitMinutes = editRule?.time_limit_minutes ?? preset?.time_limit_minutes ?? 30;
  const category = editRule?.category ?? preset?.category ?? "lainnya";
  const activeStartHour = editRule?.active_start_hour ?? "";
  const activeEndHour = editRule?.active_end_hour ?? "";

  return (
    <form action={action} className="space-y-4">
      {editRule ? <input type="hidden" name="id" value={editRule.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-[1.3fr_120px_160px_auto]">
        <div className="space-y-1.5">
          <label htmlFor="domain" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Domain
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Globe className="h-4 w-4" />
            </div>
            <input
              id="domain"
              name="domain"
              required
              defaultValue={domain}
              placeholder="youtube.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="time_limit_minutes" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Batas / hari
          </label>
          <div className="relative">
            <input
              id="time_limit_minutes"
              name="time_limit_minutes"
              type="number"
              min={1}
              max={1440}
              defaultValue={timeLimitMinutes}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
              mnt
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Kategori
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 active:scale-95 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {pending ? "Menyimpan..." : editRule ? "Perbarui Kuota" : "Simpan Kuota"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Jadwal Aktif Kuota (Opsional — kosongkan untuk pemantauan sepanjang hari)</span>
          </div>
          {editRule ? (
            <Link
              href="/dashboard/aturan"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              Batal edit
            </Link>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">Aktif mulai jam:</span>
            <HourSelect name="active_start_hour" defaultValue={activeStartHour} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">Aktif sampai jam:</span>
            <HourSelect name="active_end_hour" defaultValue={activeEndHour} />
          </label>
        </div>
      </div>

      {preset && !editRule ? (
        <p className="text-xs font-medium text-blue-700">
          Preset terpilih: {preset.label} · {preset.domain} · {preset.time_limit_minutes} menit
        </p>
      ) : null}

      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <p>{state.error}</p>
        </div>
      ) : null}
    </form>
  );
}

function HourSelect({ name, defaultValue }: { name: string; defaultValue: string | number }) {
  const hours = Array.from({ length: 24 }, (_, index) => index);
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
    >
      <option value="">Sepanjang hari (00:00 - 23:59)</option>
      {hours.map((hour) => (
        <option key={hour} value={hour}>
          Pukul {String(hour).padStart(2, "0")}:00
        </option>
      ))}
    </select>
  );
}
