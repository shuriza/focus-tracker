import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBudgetHistory,
  buildBudgetStatus,
  parseBudgetMinutes,
} from "./budget";
import type { DailyAnalytic, DayBucket } from "./types";

function row(
  id: string,
  date: string,
  domain: string,
  time_spent_seconds: number,
): DailyAnalytic {
  return {
    id,
    user_id: "user-1",
    domain,
    date,
    time_spent_seconds,
    updated_at: "2026-09-13T00:00:00Z",
  };
}

function bucket(date: string, totalMinutes: number): DayBucket {
  return {
    date,
    label: date,
    totalMinutes,
    trackedMinutes: totalMinutes,
    overLimitMinutes: 0,
  };
}

describe("buildBudgetStatus", () => {
  it("menjumlahkan seluruh domain pada hari ini saja", () => {
    const status = buildBudgetStatus(
      [
        row("a", "2026-09-13", "youtube.com", 900),
        row("b", "2026-09-13", "github.com", 600),
        row("c", "2026-09-12", "x.com", 3_600),
      ],
      "2026-09-13",
      60,
    );

    assert.equal(status.usedSeconds, 1_500);
    assert.equal(status.remainingSeconds, 2_100);
  });

  it("menggunakan amber tepat pada 75% dan 100% tanpa melewati anggaran", () => {
    const atSeventyFivePercent = buildBudgetStatus(
      [row("a", "2026-09-13", "youtube.com", 2_700)],
      "2026-09-13",
      60,
    );
    const atBudget = buildBudgetStatus(
      [row("b", "2026-09-13", "github.com", 3_600)],
      "2026-09-13",
      60,
    );

    assert.equal(atSeventyFivePercent.ratio, 0.75);
    assert.equal(atSeventyFivePercent.tone, "amber");
    assert.equal(atBudget.ratio, 1);
    assert.equal(atBudget.tone, "amber");
    assert.equal(atBudget.over, false);
  });

  it("menghitung kelebihan anggaran tanpa sisa waktu", () => {
    const status = buildBudgetStatus(
      [row("a", "2026-09-13", "youtube.com", 3_900)],
      "2026-09-13",
      60,
    );

    assert.equal(status.over, true);
    assert.equal(status.overSeconds, 300);
    assert.equal(status.remainingSeconds, 0);
    assert.equal(status.tone, "rose");
  });

  it("mengembalikan status slate saat anggaran belum diatur", () => {
    const status = buildBudgetStatus(
      [row("a", "2026-09-13", "youtube.com", 600)],
      "2026-09-13",
      null,
    );

    assert.equal(status.tone, "slate");
    assert.equal(status.ratio, 0);
    assert.equal(status.remainingSeconds, 0);
    assert.equal(status.over, false);
  });
});

describe("parseBudgetMinutes", () => {
  it("menerima hanya bilangan bulat dalam batas anggaran", () => {
    assert.deepEqual(parseBudgetMinutes(""), { minutes: null, error: null });
    assert.equal(parseBudgetMinutes("14").error, "Anggaran harian harus antara 15 dan 1440 menit.");
    assert.deepEqual(parseBudgetMinutes("15"), { minutes: 15, error: null });
    assert.deepEqual(parseBudgetMinutes("1440"), { minutes: 1440, error: null });
    assert.equal(parseBudgetMinutes("1441").error, "Anggaran harian harus antara 15 dan 1440 menit.");
    assert.equal(parseBudgetMinutes("abc").error, "Anggaran harian harus antara 15 dan 1440 menit.");
    assert.equal(parseBudgetMinutes("30.5").error, "Anggaran harian harus antara 15 dan 1440 menit.");
  });
});

describe("buildBudgetHistory", () => {
  it("menandai over hanya ketika total harian melebihi anggaran", () => {
    const history = buildBudgetHistory(
      [
        bucket("2026-09-11", 59),
        bucket("2026-09-12", 60),
        bucket("2026-09-13", 61),
      ],
      60,
    );

    assert.deepEqual(
      history.map(({ over }) => over),
      [false, false, true],
    );
  });
});
