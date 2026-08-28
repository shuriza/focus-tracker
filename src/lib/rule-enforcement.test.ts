import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRuleEnforced } from "../../extension/lib.js";

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
