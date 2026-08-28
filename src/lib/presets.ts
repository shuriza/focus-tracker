import type { Category } from "./categories";

export type RulePreset = {
  key: string;
  label: string;
  domain: string;
  time_limit_minutes: number;
  category: Category;
};

export const RULE_PRESETS = [
  {
    key: "youtube",
    label: "YouTube",
    domain: "youtube.com",
    time_limit_minutes: 30,
    category: "video",
  },
  {
    key: "x",
    label: "X",
    domain: "x.com",
    time_limit_minutes: 20,
    category: "sosial",
  },
  {
    key: "instagram",
    label: "Instagram",
    domain: "instagram.com",
    time_limit_minutes: 20,
    category: "sosial",
  },
] as const satisfies readonly RulePreset[];

export function getRulePreset(key: string | null | undefined): RulePreset | null {
  if (!key) return null;
  return RULE_PRESETS.find((preset) => preset.key === key) ?? null;
}
