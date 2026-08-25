import { Download, Flame, Clock, BarChart3, ShieldAlert, Calendar } from "lucide-react";
import { DomainBars } from "@/components/DomainBars";
import { TodayProgress } from "@/components/TodayProgress";
import { WeekChart } from "@/components/WeekChart";
import {
  buildDomainUsage,
  buildStreak,
  buildTodayDomains,
  buildTrend,
  buildWeekBuckets,
} from "@/lib/analytics";
import { hasSupabaseConfig } from "@/lib/env";
import { formatDuration, lastNDates, longDateLabel, todayISO } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";
import type { DailyAnalytic, Rule } from "@/lib/types";

export const metadata = {
  title: "Minggu ini",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        Isi <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono">.env.local</code> untuk memuat jejak durasi.
      </div>
    );
  }

  const supabase = await createClient();
  const since = lastNDates(14)[0];
  const today = todayISO();

  const [rulesResult, analyticsResult] = await Promise.all([
    supabase.from("rules").select("*").order("domain"),
    supabase
      .from("daily_analytics")
      .select("*")
      .gte("date", since)
      .order("date", { ascending: true }),
  ]);

  if (rulesResult.error || analyticsResult.error) {
    const message = rulesResult.error?.message ?? analyticsResult.error?.message;
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
        <p className="font-semibold text-rose-900">Gagal memuat data analitik</p>
        <p className="mt-1">{message}. Pastikan <code>database/schema.sql</code> sudah dijalankan di proyek Supabase.</p>
      </section>
    );
  }

  const rules = (rulesResult.data ?? []) as Rule[];
  const rows = (analyticsResult.data ?? []) as DailyAnalytic[];
  const allBuckets = buildWeekBuckets(rows, rules, new Date(), 14);
  const week = allBuckets.slice(-7);
  const domains = buildDomainUsage(rows, rules);
  const todayDomains = buildTodayDomains(rows, rules, today);

  const todaySeconds = rows
    .filter((row) => row.date === today)
    .reduce((sum, row) => sum + row.time_spent_seconds, 0);
  const weekSeconds = week.reduce((sum, day) => sum + day.totalMinutes * 60, 0);
  const prevWeekSeconds = allBuckets
    .slice(0, 7)
    .reduce((sum, day) => sum + day.totalMinutes * 60, 0);
  const overMinutes = week.reduce((sum, day) => sum + day.overLimitMinutes, 0);
  const top = domains[0];

  const streak = buildStreak(allBuckets);
  const trend = buildTrend(allBuckets);
  const wow = weekOverWeek(weekSeconds, prevWeekSeconds);

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
            <Calendar className="h-3.5 w-3.5" />
            {longDateLabel(today)}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Aktivitas & Jejak Fokus
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Ringkasan durasi pemakaian dari ekstensi browser, dipecah per hari dan per domain.
          </p>
        </div>
        <a
          href="/api/export"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          Unduh CSV
        </a>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Flame}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="Streak Fokus"
          value={streak > 0 ? `${streak} hari` : "—"}
          hint={streak > 0 ? "Berturut-turut tertib kuota" : "Belum ada catatan bersih"}
        />
        <Kpi
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Hari Ini"
          value={formatDuration(todaySeconds)}
          hint={trendHint(trend, "vs kemarin")}
        />
        <Kpi
          icon={BarChart3}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          label="7 Hari Terakhir"
          value={formatDuration(weekSeconds)}
          hint={trendHint(wow, "vs minggu lalu")}
        />
        <Kpi
          icon={ShieldAlert}
          iconColor={overMinutes > 0 ? "text-rose-600" : "text-emerald-600"}
          iconBg={overMinutes > 0 ? "bg-rose-50" : "bg-emerald-50"}
          label="Di Atas Kuota"
          value={`${overMinutes} mnt`}
          hint={top ? `Terbanyak: ${top.domain}` : "Semua terkendali"}
        />
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Durasi Harian</h2>
              <p className="text-xs text-slate-500">Statistik pemakaian 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Tercatat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Over Kuota
              </span>
            </div>
          </div>
          <div className="mt-5">
            <WeekChart data={week} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Domain Teratas</h2>
            <p className="text-xs text-slate-500">Situs yang paling sering diakses</p>
          </div>
          <div className="mt-5">
            <DomainBars data={domains} />
          </div>
        </article>
      </section>

      {/* Breakdown Section */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Breakdown Hari Ini</h2>
          <p className="text-xs text-slate-500">Penggunaan kuota per domain hari ini</p>
        </div>
        <div className="mt-5">
          <TodayProgress data={todayDomains} />
        </div>
      </section>
    </main>
  );
}

function Kpi({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 font-medium">{hint}</p>
    </article>
  );
}

function trendHint(
  trend: { value: number | null; direction: "up" | "down" },
  suffix: string,
): string {
  if (trend.value === null) return `Belum ada pembanding ${suffix}`;
  const arrow = trend.direction === "up" ? "▲" : "▼";
  const sign = trend.value > 0 ? "+" : "";
  return `${arrow} ${sign}${trend.value}% ${suffix}`;
}

function weekOverWeek(
  thisWeekSeconds: number,
  prevWeekSeconds: number,
): { value: number | null; direction: "up" | "down" } {
  if (prevWeekSeconds === 0) {
    return { value: thisWeekSeconds > 0 ? 100 : null, direction: thisWeekSeconds > 0 ? "up" : "down" };
  }
  const delta = thisWeekSeconds - prevWeekSeconds;
  const pct = Math.round((delta / prevWeekSeconds) * 100);
  return { value: pct, direction: delta >= 0 ? "up" : "down" };
}