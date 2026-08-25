import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDomainUsage,
  buildStreak,
  buildTodayDomains,
  buildTrend,
  buildWeekBuckets,
  remainingSeconds,
  usageRatio,
} from "./analytics";
import { categoryLabel } from "./categories";
import type { DailyAnalytic, Rule } from "./types";

const rules: Rule[] = [
  {
    id: "1",
    user_id: "u",
    domain: "youtube.com",
    time_limit_minutes: 30,
    category: "video",
    active_start_hour: null,
    active_end_hour: null,
    created_at: "2026-08-23T00:00:00Z",
  },
];

const rows: DailyAnalytic[] = [
  {
    id: "a",
    user_id: "u",
    domain: "youtube.com",
    date: "2026-08-23",
    time_spent_seconds: 2400,
    updated_at: "2026-08-23T00:00:00Z",
  },
  {
    id: "b",
    user_id: "u",
    domain: "github.com",
    date: "2026-08-23",
    time_spent_seconds: 600,
    updated_at: "2026-08-23T00:00:00Z",
  },
];

describe("buildWeekBuckets", () => {
  it("counts over-limit minutes only for ruled domains", () => {
    const week = buildWeekBuckets(rows, rules, new Date(2026, 7, 23));
    const sunday = week.at(-1);
    assert.equal(sunday?.date, "2026-08-23");
    assert.equal(sunday?.totalMinutes, 50);
    assert.equal(sunday?.overLimitMinutes, 10);
  });

  it("builds a custom number of days", () => {
    const week = buildWeekBuckets(rows, rules, new Date(2026, 7, 23), 14);
    assert.equal(week.length, 14);
    assert.equal(week.at(-1)?.date, "2026-08-23");
  });
});

describe("buildDomainUsage", () => {
  it("sorts domains by time and attaches matching limits + category", () => {
    const usage = buildDomainUsage(rows, rules);
    assert.equal(usage[0]?.domain, "youtube.com");
    assert.equal(usage[0]?.limitMinutes, 30);
    assert.equal(usage[0]?.category, "video");
    assert.equal(categoryLabel(usage[0]?.category ?? null), "Video & streaming");
    assert.equal(usage[1]?.limitMinutes, null);
  });
});

describe("buildTodayDomains", () => {
  it("computes ratio, remaining and over flag", () => {
    const today = buildTodayDomains(rows, rules, "2026-08-23");
    const youtube = today.find((d) => d.domain === "youtube.com");
    assert.equal(youtube?.ratio, 1);
    assert.equal(youtube?.over, true);
    assert.equal(youtube?.remainingSeconds, 0);
    const github = today.find((d) => d.domain === "github.com");
    assert.equal(github?.limitMinutes, null);
    assert.equal(github?.over, false);
  });
});

describe("buildStreak", () => {
  it("counts consecutive clean days and skips an empty today", () => {
    const monday = makeBucket("2026-08-23", 0, 0);
    const streak = buildStreak([monday]);
    assert.equal(streak, 1);
  });

  it("breaks when the most recent tracked day is over limit", () => {
    const buckets = [
      makeBucket("2026-08-22", 10, 0),
      makeBucket("2026-08-23", 50, 10),
    ];
    assert.equal(buildStreak(buckets), 0);
  });
});

describe("buildTrend", () => {
  it("returns a percentage change versus yesterday", () => {
    const buckets = [
      makeBucket("2026-08-22", 40, 0),
      makeBucket("2026-08-23", 50, 0),
    ];
    const trend = buildTrend(buckets);
    assert.equal(trend.value, 25);
    assert.equal(trend.direction, "up");
  });

  it("is null when yesterday had no data", () => {
    const buckets = [
      makeBucket("2026-08-22", 0, 0),
      makeBucket("2026-08-23", 50, 0),
    ];
    assert.equal(buildTrend(buckets).value, null);
  });
});

describe("quota helpers", () => {
  it("computes remaining time and ratio", () => {
    assert.equal(remainingSeconds(2400, 30), 0);
    assert.equal(remainingSeconds(600, 30), 1200);
    assert.equal(usageRatio(900, 30), 0.5);
    assert.equal(usageRatio(100, null), 0);
  });
});

function makeBucket(date: string, totalMinutes: number, overLimitMinutes: number) {
  return {
    date,
    label: date,
    totalMinutes,
    trackedMinutes: totalMinutes,
    overLimitMinutes,
  };
}