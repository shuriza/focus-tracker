export const RANGE_OPTIONS = [7, 14, 30] as const;

export type RangeDays = (typeof RANGE_OPTIONS)[number];

export const DEFAULT_RANGE_DAYS: RangeDays = 7;

export function parseRangeDays(raw: string | string[] | undefined): RangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return DEFAULT_RANGE_DAYS;
  const trimmed = value.trim();
  return (
    RANGE_OPTIONS.find((option) => String(option) === trimmed) ?? DEFAULT_RANGE_DAYS
  );
}

export function rangeLabel(days: RangeDays): string {
  return `${days} hari`;
}

export function rangeCompareLabel(days: RangeDays): string {
  return `vs ${days} hari sebelumnya`;
}
