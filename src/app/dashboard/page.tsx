import Link from "next/link";
import type { Metadata } from "next";
import {
  Download,
  Flame,
  Clock,
  BarChart3,
  ShieldAlert,
  Calendar,
  ArrowRight,
  Laptop,
  SlidersHorizontal,
} from "lucide-react";
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
import { refreshAuthSession } from "@/app/actions/auth";
import { hasSupabaseConfig } from "@/lib/env";
import { formatDuration, lastNDates, longDateLabel, todayISO } from "@/lib/time";
import { formatHeartbeatAge, summarizeExtensionStatus } from "@/lib/extension-status";
import { describeDashboardDataError } from "@/lib/supabase/dashboard-error";
import { createClient } from "@/lib/supabase/server";
import type { DailyAnalytic, ExtensionStatus, Rule } from "@/lib/types";

export const metadata: Metadata = {
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

  const [rulesResult, analyticsResult, statusResult] = await Promise.all([
    supabase.from("rules").select("*").order("domain"),
    supabase
      .from("daily_analytics")
      .select("*")
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase.from("extension_status").select("*").maybeSingle(),
  ]);

  const failure = rulesResult.error ?? analyticsResult.error ?? statusResult.error;
  if (failure) {
    const errorView = describeDashboardDataError(failure.message, failure.code);
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
        <p className="font-semibold text-rose-900">{errorView.title}</p>
        <p className="mt-1">{failure.message}</p>
        <p className="mt-2">{errorView.guidance}</p>
        {errorView.kind === "session" ? (
          <form action={refreshAuthSession} className="mt-4">
            <button
              type="submit"
              className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-800"
            >
              Perbarui sesi
            </button>
          </form>
        ) : null}
      </section>
    );
  }

  const rules = (rulesResult.data ?? []) as Rule[];
  const activeRules = rules.filter((rule) => rule.active !== false);
  const rows = (analyticsResult.data ?? []) as DailyAnalytic[];
  const extensionStatus = (statusResult.data ?? null) as ExtensionStatus | null;
  const statusView = summarizeExtensionStatus(extensionStatus, new Date());
  const hasUsage = rows.some((row) => row.time_spent_seconds > 0);
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

      <section
        aria-live="polite"
        aria-labelledby="extension-status-title"
        className={STATUS_TONES[statusView.tone].root + " rounded-2xl border p-5 shadow-sm"}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span
              className={STATUS_TONES[statusView.tone].pill + " inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"}
            >
              Status ekstensi
            </span>
            <div>
              <h2 id="extension-status-title" className="text-lg font-bold tracking-tight text-slate-900">
                {statusView.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{statusView.message}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{statusView.meta}</p>
            </div>
          </div>

          <Link
            href="/panduan"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
          >
            Buka panduan
          </Link>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatusStat label="Heartbeat terakhir" value={formatHeartbeatAge(extensionStatus?.last_seen_at, new Date())} />
          <StatusStat label="Sinkron terakhir" value={formatHeartbeatAge(extensionStatus?.last_sync_at, new Date())} />
          <StatusStat
            label="Antrean lokal"
            value={String(Math.max(0, extensionStatus?.pending_sync_count ?? 0)) + " item"}
          />
        </dl>

        {statusView.state === "error" && extensionStatus?.last_error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-white/70 px-4 py-3 text-sm leading-relaxed text-rose-800">
            {extensionStatus.last_error}
          </p>
        ) : null}
      </section>

      {activeRules.length === 0 && !hasUsage ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Mulai dari sini
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Dashboard siap mencatat fokusmu.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                Pasang ekstensi Chrome dan buat kuota pertama. Setelah kamu membuka situs
                yang dipantau, aktivitas akan muncul di halaman ini.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/panduan"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Laptop className="h-3.5 w-3.5" />
                Pasang ekstensi
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/aturan"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Buat kuota
              </Link>
            </div>
          </div>
        </section>
      ) : null}

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

function StatusStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

const STATUS_TONES = {
  emerald: {
    root: "border-emerald-200 bg-emerald-50/70",
    pill: "bg-emerald-600 text-white",
  },
  amber: {
    root: "border-amber-200 bg-amber-50/75",
    pill: "bg-amber-600 text-white",
  },
  slate: {
    root: "border-slate-200 bg-slate-50",
    pill: "bg-slate-700 text-white",
  },
  rose: {
    root: "border-rose-200 bg-rose-50/75",
    pill: "bg-rose-600 text-white",
  },
} as const;

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