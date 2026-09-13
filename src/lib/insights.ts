import { formatDuration, formatMinutes } from "@/lib/time";
import type {
  BudgetStatus,
  DayBucket,
  DomainUsage,
  TodayDomain,
} from "@/lib/types";

export type InsightTone = "emerald" | "amber" | "rose" | "blue";

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
};

export type InsightInput = {
  buckets: DayBucket[];
  previousBuckets: DayBucket[];
  domains: DomainUsage[];
  todayDomains: TodayDomain[];
  budget: BudgetStatus | null;
  rangeDays: number;
};

const MAX_INSIGHTS = 4;
const NEAR_BUDGET_RATIO = 0.75;

export function buildInsights(input: InsightInput): Insight[] {
  const { buckets, previousBuckets, domains, todayDomains, budget, rangeDays } = input;

  const totalMinutes = buckets.reduce((sum, bucket) => sum + bucket.totalMinutes, 0);
  const totalSeconds = domains.reduce((sum, item) => sum + item.seconds, 0);

  if (totalMinutes === 0 && domains.length === 0) {
    return [
      {
        id: "empty",
        tone: "blue",
        title: "Belum ada data untuk dianalisis",
        detail: `Pasang ekstensi Fokus Kerja lalu buat kuota domain agar ringkasan ${rangeDays} hari terakhir mulai terisi.`,
      },
    ];
  }

  const insights: Insight[] = [];

  const budgetInsight = buildBudgetInsight(budget);
  if (budgetInsight) insights.push(budgetInsight);

  const topDomainInsight = buildTopDomainInsight(
    domains,
    todayDomains,
    totalSeconds,
    rangeDays,
  );
  if (topDomainInsight) insights.push(topDomainInsight);

  const previousMinutes = previousBuckets.reduce(
    (sum, bucket) => sum + bucket.totalMinutes,
    0,
  );
  insights.push(buildTrendInsight(totalMinutes, previousMinutes, rangeDays));
  insights.push(buildQuotaInsight(buckets, rangeDays));

  return insights.slice(0, MAX_INSIGHTS);
}

function buildBudgetInsight(budget: BudgetStatus | null): Insight | null {
  if (!budget || budget.budgetMinutes === null) return null;

  const budgetText = formatMinutes(budget.budgetMinutes);

  if (budget.over) {
    return {
      id: "budget",
      tone: "rose",
      title: "Anggaran fokus harian terlampaui",
      detail: `Pemakaian hari ini ${formatDuration(budget.usedSeconds)}, lebih ${formatDuration(budget.overSeconds)} dari anggaran ${budgetText}.`,
    };
  }

  if (budget.ratio >= NEAR_BUDGET_RATIO) {
    return {
      id: "budget",
      tone: "amber",
      title: "Anggaran fokus harian hampir habis",
      detail: `Terpakai ${Math.round(budget.ratio * 100)}% dari ${budgetText}. Sisa ${formatDuration(budget.remainingSeconds)} untuk hari ini.`,
    };
  }

  return null;
}

function buildTopDomainInsight(
  domains: DomainUsage[],
  todayDomains: TodayDomain[],
  totalSeconds: number,
  rangeDays: number,
): Insight | null {
  const top = domains[0];
  if (!top || top.seconds <= 0 || totalSeconds <= 0) return null;

  const share = Math.round((top.seconds / totalSeconds) * 100);
  const today = todayDomains.find((item) => item.domain === top.domain);
  const todayText = today
    ? ` Hari ini sudah ${formatDuration(today.seconds)}.`
    : "";

  return {
    id: "top-domain",
    tone: "blue",
    title: `${top.domain} paling banyak menyita waktu`,
    detail: `${formatDuration(top.seconds)} atau ${share}% dari total ${formatDuration(totalSeconds)} selama ${rangeDays} hari terakhir.${todayText}`,
  };
}

function buildTrendInsight(
  currentMinutes: number,
  previousMinutes: number,
  rangeDays: number,
): Insight {
  const currentText = formatMinutes(currentMinutes);

  if (previousMinutes === 0) {
    return {
      id: "trend",
      tone: currentMinutes > 0 ? "amber" : "emerald",
      title: "Tren belum bisa dibandingkan",
      detail: `Belum ada pembanding untuk ${rangeDays} hari sebelumnya. Total rentang ini ${currentText}.`,
    };
  }

  const delta = currentMinutes - previousMinutes;
  const percent = Math.abs(Math.round((delta / previousMinutes) * 100));

  if (delta > 0) {
    return {
      id: "trend",
      tone: "amber",
      title: "Total waktu naik",
      detail: `Naik ${percent}% menjadi ${currentText} dibanding ${formatMinutes(previousMinutes)} pada ${rangeDays} hari sebelumnya.`,
    };
  }

  if (delta < 0) {
    return {
      id: "trend",
      tone: "emerald",
      title: "Total waktu turun",
      detail: `Turun ${percent}% menjadi ${currentText} dibanding ${formatMinutes(previousMinutes)} pada ${rangeDays} hari sebelumnya.`,
    };
  }

  return {
    id: "trend",
    tone: "emerald",
    title: "Total waktu stabil",
    detail: `Tetap ${currentText}, sama dengan ${rangeDays} hari sebelumnya.`,
  };
}

function buildQuotaInsight(buckets: DayBucket[], rangeDays: number): Insight {
  const overMinutes = buckets.reduce((sum, bucket) => sum + bucket.overLimitMinutes, 0);
  const overDays = buckets.filter((bucket) => bucket.overLimitMinutes > 0).length;

  if (overMinutes === 0) {
    return {
      id: "quota",
      tone: "emerald",
      title: "Semua kuota terjaga",
      detail: `Tidak ada kuota domain yang terlampaui dalam ${rangeDays} hari terakhir.`,
    };
  }

  return {
    id: "quota",
    tone: "rose",
    title: "Kuota domain terlampaui",
    detail: `${formatMinutes(overMinutes)} melewati kuota pada ${overDays} hari dari ${rangeDays} hari terakhir.`,
  };
}
