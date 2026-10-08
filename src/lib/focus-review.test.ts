import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFocusReviewSnapshot,
  sanitizeFocusReviewSuggestions,
  type FocusReviewSuggestion,
} from "./focus-review";
import type { DailyAnalytic, Rule } from "./types";

describe("buildFocusReviewSnapshot", () => {
  it("keeps the current period separate from the comparison period", () => {
    const snapshot = buildFocusReviewSnapshot({
      rows: [
        row("2026-10-08", "youtube.com", 3600),
        row("2026-10-07", "youtube.com", 1800),
        row("2026-10-01", "youtube.com", 1200),
      ],
      rules: [rule("youtube.com", 30)],
      focusSettings: null,
      rangeDays: 7,
      now: new Date(2026, 9, 8),
    });

    assert.deepEqual(snapshot.period, {
      start: "2026-10-02",
      end: "2026-10-08",
    });
    assert.equal(snapshot.current.totalMinutes, 90);
    assert.equal(snapshot.previous.totalMinutes, 20);
    assert.equal(snapshot.current.overLimitMinutes, 30);
    assert.equal(snapshot.topDomains[0]?.domain, "youtube.com");
    assert.equal(snapshot.topDomains[0]?.sharePercent, 100);
    assert.equal(snapshot.topDomains[0]?.overLimitMinutes, 30);
    assert.equal("user_id" in snapshot, false);
  });
});

describe("sanitizeFocusReviewSuggestions", () => {
  it("rejects domains outside the activity snapshot and invalid budgets", () => {
    const snapshot = buildFocusReviewSnapshot({
      rows: [row("2026-10-08", "youtube.com", 3600)],
      rules: [rule("youtube.com", 30)],
      focusSettings: null,
      rangeDays: 7,
      now: new Date(2026, 9, 8),
    });
    const suggestions: FocusReviewSuggestion[] = [
      {
        type: "set_domain_limit",
        domain: "unknown.example",
        minutes: 20,
        rationale: "Tidak ada bukti.",
      },
      {
        type: "set_daily_budget",
        domain: null,
        minutes: 10,
        rationale: "Terlalu rendah.",
      },
      {
        type: "set_domain_limit",
        domain: "https://www.youtube.com/path",
        minutes: 25,
        rationale: "Kurangi batas berdasarkan pemakaian.",
      },
      {
        type: "set_domain_limit",
        domain: "youtube.com",
        minutes: 20,
        rationale: "Duplikat yang tidak perlu.",
      },
    ];

    const sanitized = sanitizeFocusReviewSuggestions(suggestions, snapshot);

    assert.deepEqual(sanitized, [
      {
        type: "set_domain_limit",
        domain: "youtube.com",
        minutes: 25,
        rationale: "Kurangi batas berdasarkan pemakaian.",
      },
    ]);
  });

  it("allows one valid daily budget proposal", () => {
    const snapshot = buildFocusReviewSnapshot({
      rows: [row("2026-10-08", "github.com", 1800)],
      rules: [rule("github.com", 60)],
      focusSettings: null,
      rangeDays: 7,
      now: new Date(2026, 9, 8),
    });

    const sanitized = sanitizeFocusReviewSuggestions(
      [
        {
          type: "set_daily_budget",
          domain: "not-used.example",
          minutes: 240,
          rationale: "Batas harian menjaga ritme.",
        },
      ],
      snapshot,
    );

    assert.equal(sanitized.length, 1);
    assert.equal(sanitized[0]?.domain, null);
    assert.equal(sanitized[0]?.minutes, 240);
  });
});

function row(date: string, domain: string, seconds: number): DailyAnalytic {
  return {
    id: `${date}-${domain}`,
    user_id: "user-1",
    domain,
    date,
    time_spent_seconds: seconds,
    updated_at: `${date}T12:00:00.000Z`,
  };
}

function rule(domain: string, timeLimitMinutes: number): Rule {
  return {
    id: `rule-${domain}`,
    user_id: "user-1",
    domain,
    time_limit_minutes: timeLimitMinutes,
    category: "video",
    active: true,
    active_start_hour: null,
    active_end_hour: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}
