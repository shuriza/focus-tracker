import Link from "next/link";
import { ArrowRight, Settings } from "lucide-react";
import type { BudgetStatus } from "@/lib/types";

const toneStyles = {
  emerald: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
  },
  rose: {
    bar: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
  },
  slate: {
    bar: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
    text: "text-slate-600",
  },
};

export function BudgetCard({ status }: { status: BudgetStatus }) {
  const percentage = Math.round(status.ratio * 100);
  const styles = toneStyles[status.tone];

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Anggaran fokus harian
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {status.headline}
          </h2>
        </div>
        {status.budgetMinutes === null ? (
          <Settings className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles.badge}`}>
            {percentage}% terpakai
          </span>
        )}
      </div>

      {status.budgetMinutes === null ? (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-sm leading-relaxed text-slate-600">{status.detail}</p>
          <Link
            href="/dashboard/aturan"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Atur anggaran
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-5">
          <div
            role="progressbar"
            aria-label="Pemakaian anggaran fokus harian"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${percentage}% anggaran fokus harian terpakai`}
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${styles.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="sr-only">{percentage}% anggaran fokus harian telah terpakai.</p>
          <div className="mt-3 flex items-start justify-between gap-4 text-sm">
            <p className="leading-relaxed text-slate-600">{status.detail}</p>
            <span className={`shrink-0 font-semibold ${styles.text}`}>
              {percentage}% terpakai
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
