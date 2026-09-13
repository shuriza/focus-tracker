import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInsights, type InsightInput } from "./insights";
import type {
  BudgetStatus,
  DayBucket,
  DomainUsage,
  TodayDomain,
} from "./types";

describe("buildInsights", () => {
  it("keeps a deterministic precedence and caps at four insights", () => {
    const insights = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-12", 100, 0), bucket("2026-09-13", 140, 20)],
        previousBuckets: [bucket("2026-09-10", 60, 0), bucket("2026-09-11", 60, 0)],
        domains: [domain("youtube.com", 7200), domain("github.com", 7200)],
        budget: budgetStatus({
          budgetMinutes: 240,
          usedSeconds: 18000,
          over: true,
          overSeconds: 3600,
          ratio: 1,
          tone: "rose",
        }),
      }),
    );

    assert.deepEqual(
      insights.map((item) => item.id),
      ["budget", "top-domain", "trend", "quota"],
    );
    assert.equal(insights.length, 4);
    assert.equal(new Set(insights.map((item) => item.id)).size, 4);
  });

  it("leads with a rose insight when the daily budget is exceeded", () => {
    const [first] = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 300, 0)],
        domains: [domain("youtube.com", 18000)],
        budget: budgetStatus({
          budgetMinutes: 240,
          usedSeconds: 18000,
          over: true,
          overSeconds: 3600,
          ratio: 1,
          tone: "rose",
        }),
      }),
    );

    assert.equal(first?.id, "budget");
    assert.equal(first?.tone, "rose");
    assert.match(first?.detail ?? "", /1j 0m/);
  });

  it("warns in amber once the budget is at least 75 percent used", () => {
    const [first] = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 180, 0)],
        domains: [domain("youtube.com", 10800)],
        budget: budgetStatus({
          budgetMinutes: 240,
          usedSeconds: 10800,
          remainingSeconds: 3600,
          ratio: 0.75,
          tone: "amber",
        }),
      }),
    );

    assert.equal(first?.id, "budget");
    assert.equal(first?.tone, "amber");
  });

  it("skips the budget insight below the warning threshold or when unset", () => {
    const relaxed = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 60, 0)],
        domains: [domain("youtube.com", 3600)],
        budget: budgetStatus({
          budgetMinutes: 240,
          usedSeconds: 3600,
          remainingSeconds: 10800,
          ratio: 0.25,
        }),
      }),
    );
    const unset = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 600, 0)],
        domains: [domain("youtube.com", 36000)],
        budget: budgetStatus({ tone: "slate" }),
      }),
    );

    assert.equal(relaxed.some((item) => item.id === "budget"), false);
    assert.equal(unset.some((item) => item.id === "budget"), false);
  });

  it("returns exactly one empty insight when there is no data at all", () => {
    const insights = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-12", 0, 0), bucket("2026-09-13", 0, 0)],
        budget: budgetStatus({
          budgetMinutes: 240,
          usedSeconds: 18000,
          over: true,
          overSeconds: 3600,
          ratio: 1,
          tone: "rose",
        }),
      }),
    );

    assert.equal(insights.length, 1);
    assert.equal(insights[0]?.id, "empty");
    assert.equal(insights[0]?.tone, "blue");
  });

  it("reports the top domain share as a rounded percentage", () => {
    const insights = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 100, 0)],
        domains: [domain("youtube.com", 4000), domain("github.com", 2000)],
        todayDomains: [today("youtube.com", 1800)],
      }),
    );
    const top = insights.find((item) => item.id === "top-domain");

    assert.equal(top?.tone, "blue");
    assert.match(top?.title ?? "", /^youtube\.com/);
    assert.match(top?.detail ?? "", /67%/);
    assert.match(top?.detail ?? "", /Hari ini sudah 30m 0s/);
  });

  it("does not claim a percentage when the previous period had no minutes", () => {
    const insights = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 90, 0)],
        previousBuckets: [bucket("2026-09-12", 0, 0)],
        domains: [domain("youtube.com", 5400)],
      }),
    );
    const trend = insights.find((item) => item.id === "trend");

    assert.equal(trend?.tone, "amber");
    assert.match(trend?.detail ?? "", /Belum ada pembanding/);
    assert.equal(/%/.test(trend?.detail ?? ""), false);
  });

  it("marks rising totals amber and falling totals emerald with a percentage", () => {
    const rising = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 120, 0)],
        previousBuckets: [bucket("2026-09-12", 100, 0)],
        domains: [domain("youtube.com", 7200)],
      }),
    ).find((item) => item.id === "trend");
    const falling = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 80, 0)],
        previousBuckets: [bucket("2026-09-12", 100, 0)],
        domains: [domain("youtube.com", 4800)],
      }),
    ).find((item) => item.id === "trend");
    const flat = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 100, 0)],
        previousBuckets: [bucket("2026-09-12", 100, 0)],
        domains: [domain("youtube.com", 6000)],
      }),
    ).find((item) => item.id === "trend");

    assert.equal(rising?.tone, "amber");
    assert.match(rising?.detail ?? "", /20%/);
    assert.equal(falling?.tone, "emerald");
    assert.match(falling?.detail ?? "", /20%/);
    assert.equal(flat?.tone, "emerald");
  });

  it("counts over-quota minutes and the days that breached them", () => {
    const breached = buildInsights(
      makeInput({
        buckets: [
          bucket("2026-09-11", 60, 10),
          bucket("2026-09-12", 60, 0),
          bucket("2026-09-13", 60, 25),
        ],
        domains: [domain("youtube.com", 10800)],
        rangeDays: 3,
      }),
    ).find((item) => item.id === "quota");
    const clean = buildInsights(
      makeInput({
        buckets: [bucket("2026-09-13", 60, 0)],
        domains: [domain("youtube.com", 3600)],
      }),
    ).find((item) => item.id === "quota");

    assert.equal(breached?.tone, "rose");
    assert.match(breached?.detail ?? "", /35 mnt/);
    assert.match(breached?.detail ?? "", /2 hari dari 3 hari/);
    assert.equal(clean?.tone, "emerald");
    assert.equal(clean?.title, "Semua kuota terjaga");
  });
});

function makeInput(partial: Partial<InsightInput>): InsightInput {
  return {
    buckets: [],
    previousBuckets: [],
    domains: [],
    todayDomains: [],
    budget: null,
    rangeDays: 7,
    ...partial,
  };
}

function bucket(date: string, totalMinutes: number, overLimitMinutes: number): DayBucket {
  return {
    date,
    label: date,
    totalMinutes,
    trackedMinutes: totalMinutes,
    overLimitMinutes,
  };
}

function domain(name: string, seconds: number): DomainUsage {
  return { domain: name, seconds, limitMinutes: null, category: null };
}

function today(name: string, seconds: number): TodayDomain {
  return {
    domain: name,
    seconds,
    limitMinutes: null,
    category: null,
    ratio: 0,
    remainingSeconds: 0,
    over: false,
  };
}

function budgetStatus(partial: Partial<BudgetStatus>): BudgetStatus {
  return {
    budgetMinutes: null,
    usedSeconds: 0,
    remainingSeconds: 0,
    ratio: 0,
    over: false,
    overSeconds: 0,
    tone: "slate",
    headline: "",
    detail: "",
    ...partial,
  };
}
