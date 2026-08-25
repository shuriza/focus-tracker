export type Rule = {
  id: string;
  user_id: string;
  domain: string;
  time_limit_minutes: number;
  category: string | null;
  active_start_hour: number | null;
  active_end_hour: number | null;
  created_at: string;
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