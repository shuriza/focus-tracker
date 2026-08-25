import { SlidersHorizontal } from "lucide-react";
import { RuleForm } from "@/components/RuleForm";
import { RuleList } from "@/components/RuleList";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Rule } from "@/lib/types";

export const metadata = {
  title: "Aturan",
};

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        Isi <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono">.env.local</code> untuk memuat aturan.
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("rules").select("*").order("domain");

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
        <p className="font-semibold text-rose-900">Gagal memuat aturan kuota</p>
        <p className="mt-1">{error.message}</p>
      </section>
    );
  }

  const rules = (data ?? []) as Rule[];

  return (
    <main className="space-y-8">
      {/* Header */}
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

      {/* Add / Update Rule Form Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Tambah atau Perbarui Kuota</h2>
          <p className="text-xs text-slate-500">
            Domain yang sudah terdaftar akan otomatis diperbarui dengan batas waktu yang baru.
          </p>
        </div>
        <div className="mt-5">
          <RuleForm />
        </div>
      </section>

      {/* Active Rules List */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Kuota Aktif</h2>
            <p className="text-xs text-slate-500">Daftar domain yang sedang diawasi oleh pemblokir</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
            {rules.length} domain
          </span>
        </div>
        <div className="mt-5">
          <RuleList rules={rules} />
        </div>
      </section>
    </main>
  );
}

