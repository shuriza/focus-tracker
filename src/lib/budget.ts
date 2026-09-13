import { formatDuration, formatMinutes } from "@/lib/time";
import type { BudgetStatus, DailyAnalytic, DayBucket } from "@/lib/types";

export const DEFAULT_DAILY_BUDGET_MINUTES = 240;
export const MIN_DAILY_BUDGET_MINUTES = 15;
export const MAX_DAILY_BUDGET_MINUTES = 1440;

const BUDGET_ERROR = "Anggaran harian harus antara 15 dan 1440 menit.";

export function buildBudgetStatus(
  rows: DailyAnalytic[],
  today: string,
  budgetMinutes: number | null,
): BudgetStatus {
  const usedSeconds = rows.reduce(
    (total, row) => (row.date === today ? total + row.time_spent_seconds : total),
    0,
  );
  const validBudget =
    budgetMinutes !== null && Number.isFinite(budgetMinutes) && budgetMinutes > 0
      ? budgetMinutes
      : null;

  if (validBudget === null) {
    return {
      budgetMinutes: null,
      usedSeconds,
      remainingSeconds: 0,
      ratio: 0,
      over: false,
      overSeconds: 0,
      tone: "slate",
      headline: "Atur anggaran fokus harian",
      detail: "Tetapkan anggaran agar sisa waktu fokus hari ini dapat dipantau.",
    };
  }

  const budgetSeconds = validBudget * 60;
  const over = usedSeconds > budgetSeconds;
  const remainingSeconds = Math.max(0, budgetSeconds - usedSeconds);
  const overSeconds = Math.max(0, usedSeconds - budgetSeconds);
  const ratio = Math.max(0, Math.min(1, usedSeconds / budgetSeconds));
  const tone = over ? "rose" : ratio >= 0.75 ? "amber" : "emerald";

  return {
    budgetMinutes: validBudget,
    usedSeconds,
    remainingSeconds,
    ratio,
    over,
    overSeconds,
    tone,
    headline: over
      ? `Melewati anggaran ${formatDuration(overSeconds)}`
      : `Sisa ${formatDuration(remainingSeconds)} hari ini`,
    detail: over
      ? `Pemakaian hari ini ${formatDuration(usedSeconds)} dari anggaran ${formatMinutes(validBudget)}.`
      : `Terpakai ${formatDuration(usedSeconds)} dari anggaran ${formatMinutes(validBudget)}.`,
  };
}

export function parseBudgetMinutes(raw: string): {
  minutes: number | null;
  error: string | null;
} {
  const value = raw.trim();
  if (value === "") return { minutes: null, error: null };

  const minutes = Number(value);
  if (
    !Number.isFinite(minutes) ||
    !Number.isInteger(minutes) ||
    minutes < MIN_DAILY_BUDGET_MINUTES ||
    minutes > MAX_DAILY_BUDGET_MINUTES
  ) {
    return { minutes: null, error: BUDGET_ERROR };
  }

  return { minutes, error: null };
}

export type BudgetDay = {
  date: string;
  label: string;
  totalMinutes: number;
  budgetMinutes: number | null;
  over: boolean;
};

export function buildBudgetHistory(
  buckets: DayBucket[],
  budgetMinutes: number | null,
): BudgetDay[] {
  return buckets.map(({ date, label, totalMinutes }) => ({
    date,
    label,
    totalMinutes,
    budgetMinutes,
    over: budgetMinutes !== null && totalMinutes > budgetMinutes,
  }));
}
