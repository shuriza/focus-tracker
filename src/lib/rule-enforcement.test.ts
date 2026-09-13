import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBudgetSnapshot, findRule, isRuleEnforced } from "../../extension/lib.js";

describe("findRule", () => {
  it("finds rules for exact domains and subdomains", () => {
    const rules = [{ domain: "youtube.com" }, { domain: "x.com" }];

    assert.equal(findRule("www.youtube.com", rules), rules[0]);
    assert.equal(findRule("m.youtube.com", rules), rules[0]);
    assert.equal(findRule("example.com", rules), null);
  });
});

describe("isRuleEnforced", () => {
  it("treats inactive rules as unenforced", () => {
    const inactive = {
      active: false,
      active_start_hour: null,
      active_end_hour: null,
    };

    assert.equal(isRuleEnforced(inactive), false);
    assert.equal(
      isRuleEnforced(
        { active: false, active_start_hour: 9, active_end_hour: 17 },
        new Date(2026, 7, 23, 10),
      ),
      false,
    );
  });

  it("enforces active scheduled rules within the active window", () => {
    const rule = {
      active: true,
      active_start_hour: 9,
      active_end_hour: 17,
    };

    assert.equal(isRuleEnforced(rule, new Date(2026, 7, 23, 10)), true);
    assert.equal(isRuleEnforced(rule, new Date(2026, 7, 23, 20)), false);
  });
});

describe("buildBudgetSnapshot", () => {
  it("sums only usage entries for the requested date", () => {
    const usage = {
      "2026-09-13:youtube.com": 600,
      "2026-09-13:news.ycombinator.com": 300,
      "2026-09-12:youtube.com": 9000,
    };

    assert.equal(buildBudgetSnapshot(usage, "2026-09-13", 60).usedSeconds, 900);
    assert.equal(buildBudgetSnapshot(usage, "2026-09-12", 60).usedSeconds, 9000);
    assert.equal(buildBudgetSnapshot(usage, "2026-09-11", 60).usedSeconds, 0);
  });

  it("counts domains containing dots and colons", () => {
    const usage = {
      "2026-09-13:sub.domain.example.co.id": 120,
      "2026-09-13:weird:host.example.com": 60,
    };

    assert.equal(buildBudgetSnapshot(usage, "2026-09-13", 60).usedSeconds, 180);
  });

  it("returns a neutral snapshot when the budget is unset", () => {
    const usage = { "2026-09-13:youtube.com": 1200 };

    assert.deepEqual(buildBudgetSnapshot(usage, "2026-09-13", null), {
      usedSeconds: 1200,
      budgetMinutes: null,
      remainingSeconds: 0,
      ratio: 0,
      over: false,
    });
    assert.deepEqual(buildBudgetSnapshot(usage, "2026-09-13", 0), {
      usedSeconds: 1200,
      budgetMinutes: null,
      remainingSeconds: 0,
      ratio: 0,
      over: false,
    });
  });

  it("treats exactly reaching the budget as not over", () => {
    const snapshot = buildBudgetSnapshot({ "2026-09-13:youtube.com": 3600 }, "2026-09-13", 60);

    assert.equal(snapshot.over, false);
    assert.equal(snapshot.remainingSeconds, 0);
    assert.equal(snapshot.ratio, 1);
  });

  it("clamps ratio and remaining time once the budget is exceeded", () => {
    const snapshot = buildBudgetSnapshot({ "2026-09-13:youtube.com": 5400 }, "2026-09-13", 60);

    assert.equal(snapshot.over, true);
    assert.equal(snapshot.remainingSeconds, 0);
    assert.equal(snapshot.ratio, 1);
  });
});
