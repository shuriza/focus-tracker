import { buildBudgetStatus } from "@/lib/budget";
import {
  buildDomainUsage,
  buildWeekBuckets,
  findRuleForDomain,
} from "@/lib/analytics";
import type { RangeDays } from "@/lib/range";
import { normalizeDomain, todayISO } from "@/lib/time";
import type {
  DailyAnalytic,
  FocusSettings,
  Rule,
} from "@/lib/types";

const MAX_PROMPT_DOMAINS = 8;
const MAX_REVIEW_ACTIONS = 3;

export type FocusReviewPattern = {
  title: string;
  detail: string;
  evidence: string[];
};

export type FocusReviewActionType =
  | "set_domain_limit"
  | "set_daily_budget";

export type FocusReviewSuggestion = {
  type: FocusReviewActionType;
  domain: string | null;
  minutes: number;
  rationale: string;
};

export type FocusReviewActionStatus = "pending" | "applied" | "dismissed";

export type FocusReviewAction = FocusReviewSuggestion & {
  id: string;
  status: FocusReviewActionStatus;
  decidedAt: string | null;
};

export type FocusReview = {
  id: string;
  rangeDays: RangeDays;
  periodStart: string;
  periodEnd: string;
  summary: string;
  patterns: FocusReviewPattern[];
  actions: FocusReviewAction[];
  model: string;
  createdAt: string;
};

export type FocusReviewSnapshot = {
  rangeDays: RangeDays;
  period: {
    start: string;
    end: string;
  };
  current: {
    totalMinutes: number;
    activeDays: number;
    overLimitMinutes: number;
  };
  previous: {
    totalMinutes: number;
    activeDays: number;
  };
  trendPercent: number | null;
  dailyTotals: Array<{
    date: string;
    totalMinutes: number;
    overLimitMinutes: number;
  }>;
  topDomains: Array<{
    domain: string;
    minutes: number;
    sharePercent: number;
    limitMinutes: number | null;
    overLimitMinutes: number;
    category: string | null;
  }>;
  todayBudget: {
    limitMinutes: number | null;
    usedMinutes: number;
    ratioPercent: number;
    overMinutes: number;
  };
  activeRuleCount: number;
};

export function buildFocusReviewSnapshot({
  rows,
  rules,
  focusSettings,
  rangeDays,
  now = new Date(),
}: {
  rows: DailyAnalytic[];
  rules: Rule[];
  focusSettings: FocusSettings | null;
  rangeDays: RangeDays;
  now?: Date;
}): FocusReviewSnapshot {
  const allBuckets = buildWeekBuckets(rows, rules, now, rangeDays * 2);
  const currentBuckets = allBuckets.slice(-rangeDays);
  const previousBuckets = allBuckets.slice(0, rangeDays);
  const currentDates = new Set(currentBuckets.map((bucket) => bucket.date));
  const currentRows = rows.filter((row) => currentDates.has(row.date));
  const domains = buildDomainUsage(currentRows, rules);

  const currentSeconds = currentRows.reduce(
    (total, row) => total + row.time_spent_seconds,
    0,
  );
  const previousDates = new Set(previousBuckets.map((bucket) => bucket.date));
  const previousSeconds = rows.reduce(
    (total, row) =>
      previousDates.has(row.date) ? total + row.time_spent_seconds : total,
    0,
  );
  const budget = buildBudgetStatus(
    rows,
    todayISO(now),
    focusSettings?.daily_budget_minutes ?? null,
  );

  return {
    rangeDays,
    period: {
      start: currentBuckets[0]?.date ?? todayISO(now),
      end: currentBuckets.at(-1)?.date ?? todayISO(now),
    },
    current: {
      totalMinutes: Math.round(currentSeconds / 60),
      activeDays: currentBuckets.filter((bucket) => bucket.totalMinutes > 0).length,
      overLimitMinutes: currentBuckets.reduce(
        (total, bucket) => total + bucket.overLimitMinutes,
        0,
      ),
    },
    previous: {
      totalMinutes: Math.round(previousSeconds / 60),
      activeDays: previousBuckets.filter((bucket) => bucket.totalMinutes > 0).length,
    },
    trendPercent:
      previousSeconds > 0
        ? Math.round(((currentSeconds - previousSeconds) / previousSeconds) * 100)
        : null,
    dailyTotals: currentBuckets.map((bucket) => ({
      date: bucket.date,
      totalMinutes: bucket.totalMinutes,
      overLimitMinutes: bucket.overLimitMinutes,
    })),
    topDomains: domains.slice(0, MAX_PROMPT_DOMAINS).map((domain) => {
      const rule = findRuleForDomain(domain.domain, rules);
      const overLimitSeconds =
        rule && rule.active !== false
          ? currentRows.reduce((total, row) => {
              if (row.domain !== domain.domain) return total;
              return (
                total +
                Math.max(0, row.time_spent_seconds - rule.time_limit_minutes * 60)
              );
            }, 0)
          : 0;

      return {
        domain: domain.domain,
        minutes: Math.round(domain.seconds / 60),
        sharePercent:
          currentSeconds > 0
            ? Math.round((domain.seconds / currentSeconds) * 100)
            : 0,
        limitMinutes: domain.limitMinutes,
        overLimitMinutes: Math.round(overLimitSeconds / 60),
        category: domain.category,
      };
    }),
    todayBudget: {
      limitMinutes: budget.budgetMinutes,
      usedMinutes: Math.round(budget.usedSeconds / 60),
      ratioPercent: Math.round(budget.ratio * 100),
      overMinutes: Math.round(budget.overSeconds / 60),
    },
    activeRuleCount: rules.filter((rule) => rule.active !== false).length,
  };
}

export function sanitizeFocusReviewSuggestions(
  suggestions: FocusReviewSuggestion[],
  snapshot: FocusReviewSnapshot,
): FocusReviewSuggestion[] {
  const allowedDomains = new Set(
    snapshot.topDomains.map((item) => normalizeDomain(item.domain)),
  );
  const seen = new Set<string>();
  const sanitized: FocusReviewSuggestion[] = [];

  for (const suggestion of suggestions) {
    const minutes = Math.round(suggestion.minutes);
    const rationale = suggestion.rationale.trim();
    if (!Number.isFinite(minutes) || !rationale) continue;

    if (suggestion.type === "set_domain_limit") {
      const domain = normalizeDomain(suggestion.domain ?? "");
      if (!domain || !allowedDomains.has(domain) || minutes < 1 || minutes > 1440) {
        continue;
      }

      const key = `${suggestion.type}:${domain}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sanitized.push({ ...suggestion, domain, minutes, rationale });
    } else if (
      suggestion.type === "set_daily_budget" &&
      minutes >= 15 &&
      minutes <= 1440
    ) {
      const key = suggestion.type;
      if (seen.has(key)) continue;
      seen.add(key);
      sanitized.push({ ...suggestion, domain: null, minutes, rationale });
    }

    if (sanitized.length === MAX_REVIEW_ACTIONS) break;
  }

  return sanitized;
}
