import type {
  DailyAnalytic,
  DayBucket,
  DomainUsage,
  Rule,
  TodayDomain,
} from "./types";
import { domainMatches, lastNDates, weekdayLabel } from "./time";

export function findRuleForDomain(domain: string, rules: Rule[]): Rule | null {
  return (
    rules.find((rule) => domainMatches(domain, rule.domain)) ?? null
  );
}

export function buildWeekBuckets(
  rows: DailyAnalytic[],
  rules: Rule[],
  now = new Date(),
  days = 7,
): DayBucket[] {
  const dates = lastNDates(days, now);
  return dates.map((date) => {
    const dayRows = rows.filter((row) => row.date === date);
    const totalSeconds = dayRows.reduce(
      (sum, row) => sum + row.time_spent_seconds,
      0,
    );
    const overLimitSeconds = dayRows.reduce((sum, row) => {
      const rule = findRuleForDomain(row.domain, rules);
      if (!rule) return sum;
      const over = row.time_spent_seconds - rule.time_limit_minutes * 60;
      return sum + Math.max(0, over);
    }, 0);

    return {
      date,
      label: weekdayLabel(date),
      totalMinutes: Math.round(totalSeconds / 60),
      trackedMinutes: Math.round(totalSeconds / 60),
      overLimitMinutes: Math.round(overLimitSeconds / 60),
    };
  });
}

export function buildDomainUsage(
  rows: DailyAnalytic[],
  rules: Rule[],
): DomainUsage[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.domain, (totals.get(row.domain) ?? 0) + row.time_spent_seconds);
  }

  return [...totals.entries()]
    .map(([domain, seconds]) => {
      const rule = findRuleForDomain(domain, rules);
      return {
        domain,
        seconds,
        limitMinutes: rule?.time_limit_minutes ?? null,
        category: rule?.category ?? null,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);
}

export function buildTodayDomains(
  rows: DailyAnalytic[],
  rules: Rule[],
  today: string,
): TodayDomain[] {
  const domains = buildDomainUsage(
    rows.filter((row) => row.date === today),
    rules,
  );
  return domains.map((item) => {
    const limit = item.limitMinutes;
    const remaining = limit ? Math.max(0, limit * 60 - item.seconds) : 0;
    const over = limit ? item.seconds > limit * 60 : false;
    return {
      domain: item.domain,
      seconds: item.seconds,
      limitMinutes: limit,
      category: item.category,
      ratio: limit ? Math.min(1, item.seconds / (limit * 60)) : 0,
      remainingSeconds: remaining,
      over,
    };
  });
}

export function todayUsageForDomain(
  rows: DailyAnalytic[],
  domain: string,
  today: string,
): number {
  return rows
    .filter((row) => row.date === today && domainMatches(row.domain, domain))
    .reduce((sum, row) => sum + row.time_spent_seconds, 0);
}

export function remainingSeconds(
  usedSeconds: number,
  limitMinutes: number,
): number {
  return Math.max(0, limitMinutes * 60 - usedSeconds);
}

export function usageRatio(usedSeconds: number, limitMinutes: number | null): number {
  if (!limitMinutes || limitMinutes <= 0) return 0;
  return Math.min(1, usedSeconds / (limitMinutes * 60));
}

export function buildStreak(week: DayBucket[]): number {
  if (week.length === 0) return 0;
  let startIndex = week.length - 1;
  if (week[startIndex].totalMinutes === 0 && startIndex > 0) {
    startIndex -= 1;
  }
  let streak = 0;
  for (let i = startIndex; i >= 0; i -= 1) {
    if (week[i].overLimitMinutes > 0) break;
    streak += 1;
  }
  return streak;
}

export type Trend = { value: number | null; direction: "up" | "down" };

export function buildTrend(week: DayBucket[]): Trend {
  const today = week[week.length - 1];
  const yesterday = week[week.length - 2];
  if (!today || !yesterday || yesterday.totalMinutes === 0) {
    return { value: null, direction: "down" };
  }
  const delta = today.totalMinutes - yesterday.totalMinutes;
  const pct = Math.round((delta / yesterday.totalMinutes) * 100);
  return { value: pct, direction: delta >= 0 ? "up" : "down" };
}