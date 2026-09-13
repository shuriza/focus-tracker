import Link from "next/link";
import type { Metadata } from "next";
import { SlidersHorizontal, Target } from "lucide-react";
import { BudgetForm } from "@/components/BudgetForm";
import { RuleForm } from "@/components/RuleForm";
import { RuleList } from "@/components/RuleList";
import { hasSupabaseConfig } from "@/lib/env";
import { getRulePreset, RULE_PRESETS } from "@/lib/presets";
import { findById, firstParam, type SearchParamValue } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import type { FocusSettings, Rule } from "@/lib/types";

export const metadata: Metadata = {
  title: "Aturan",
};

export const dynamic = "force-dynamic";

export default async function RulesPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: SearchParamValue; preset?: SearchParamValue }>;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        Isi <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono">.env.local</code> untuk memuat aturan.
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const [rulesResult, settingsResult] = await Promise.all([
    supabase.from("rules").select("*").order("domain"),
    supabase.from("focus_settings").select("*").maybeSingle(),
  ]);
  const error = rulesResult.error ?? settingsResult.error;

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
        <p className="font-semibold text-rose-900">Gagal memuat aturan kuota</p>
        <p className="mt-1">{error.message}</p>
      </section>
    );
  }

  const rules = (rulesResult.data ?? []) as Rule[];
  const focusSettings = (settingsResult.data ?? null) as FocusSettings | null;
  const activeRules = rules.filter((rule) => rule.active !== false);
  const inactiveCount = rules.length - activeRules.length;
  const editRule = findById(rules, params.edit);
  const preset = editRule ? null : getRulePreset(firstParam(params.preset));

  return (
    <main className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Konfigurasi Batas
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Aturan Kuota Domain
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Batas dihitung per hari kalender perangkat. Subdomain secara otomatis mengikuti domain induk (contoh: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700">m.youtube.com</code> memakai kuota <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700">youtube.com</code>).
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Anggaran Fokus Harian</h2>
              <p className="text-xs text-slate-500">
                Batas total waktu browsing lintas-domain per hari. Anggaran hanya memberi sinyal di
                dashboard — pemblokiran tetap mengikuti kuota per domain.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <BudgetForm budgetMinutes={focusSettings?.daily_budget_minutes ?? null} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editRule ? `Ubah Kuota ${editRule.domain}` : "Tambah atau Perbarui Kuota"}
              </h2>
              <p className="text-xs text-slate-500">
                {editRule
                  ? "Simpan perubahan untuk domain yang dipilih."
                  : "Domain yang sudah terdaftar akan otomatis diperbarui dengan batas waktu yang baru."}
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {activeRules.length} aktif · {inactiveCount} nonaktif
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {RULE_PRESETS.map((item) => {
            const selected = !editRule && preset?.key === item.key;
            return (
              <Link
                key={item.key}
                href={`/dashboard/aturan?preset=${item.key}`}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"}`}
              >
                <span>{item.label}</span>
                <span className="text-[11px] font-medium text-slate-500">
                  {item.domain} · {item.time_limit_minutes} mnt
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5">
          <RuleForm key={editRule?.id ?? preset?.key ?? "create"} editRule={editRule} preset={preset} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Semua Aturan</h2>
            <p className="text-xs text-slate-500">Aktifkan, nonaktifkan, ubah, atau hapus kuota domain kapan saja</p>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            {activeRules.length} aktif / {inactiveCount} nonaktif
          </span>
        </div>
        <div className="mt-5">
          <RuleList rules={rules} />
        </div>
      </section>
    </main>
  );
}
