export type Rule = {
  id: string;
  user_id: string;
  domain: string;
  time_limit_minutes: number;
  category: string | null;
  active: boolean;
  active_start_hour: number | null;
  active_end_hour: number | null;
  created_at: string;
};

export type ExtensionStatus = {
  id: string;
  user_id: string;
  state: "connected" | "error";
  extension_version: string;
  manifest_version: string;
  last_seen_at: string;
  last_sync_at: string | null;
  pending_sync_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type FocusSettings = {
  id: string;
  user_id: string;
  daily_budget_minutes: number;
  created_at: string;
  updated_at: string;
};

export type BudgetStatus = {
  budgetMinutes: number | null;
  usedSeconds: number;
  remainingSeconds: number;
  ratio: number;
  over: boolean;
  overSeconds: number;
  tone: "emerald" | "amber" | "rose" | "slate";
  headline: string;
  detail: string;
};

export type DailyAnalytic = {
  id: string;
  user_id: string;
  domain: string;
  date: string;
  time_spent_seconds: number;
  updated_at: string;
};

export type DomainUsage = {
  domain: string;
  seconds: number;
  limitMinutes: number | null;
  category: string | null;
};

export type DayBucket = {
  date: string;
  label: string;
  totalMinutes: number;
  trackedMinutes: number;
  overLimitMinutes: number;
};

export type TodayDomain = {
  domain: string;
  seconds: number;
  limitMinutes: number | null;
  category: string | null;
  ratio: number;
  remainingSeconds: number;
  over: boolean;
};
