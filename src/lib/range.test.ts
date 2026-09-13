import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RANGE_OPTIONS,
  parseRangeDays,
  rangeCompareLabel,
  rangeLabel,
} from "./range";

describe("parseRangeOptions", () => {
  it("accepts every supported option", () => {
    for (const option of RANGE_OPTIONS) {
      assert.equal(parseRangeDays(String(option)), option);
    }
  });

  it("reads the first entry of a repeated query param", () => {
    assert.equal(parseRangeDays(["30", "14"]), 30);
    assert.equal(parseRangeDays([]), 7);
  });

  it("tolerates surrounding whitespace", () => {
    assert.equal(parseRangeDays("  14  "), 14);
  });

  it("falls back to 7 for unsupported values", () => {
    assert.equal(parseRangeDays(undefined), 7);
    assert.equal(parseRangeDays(""), 7);
    assert.equal(parseRangeDays("0"), 7);
    assert.equal(parseRangeDays("-7"), 7);
    assert.equal(parseRangeDays("1000"), 7);
    assert.equal(parseRangeDays("abc"), 7);
    assert.equal(parseRangeDays("7.5"), 7);
    assert.equal(parseRangeDays("14abc"), 7);
  });
});

describe("range labels", () => {
  it("formats Indonesian labels", () => {
    assert.equal(rangeLabel(7), "7 hari");
    assert.equal(rangeLabel(30), "30 hari");
    assert.equal(rangeCompareLabel(7), "vs 7 hari sebelumnya");
    assert.equal(rangeCompareLabel(14), "vs 14 hari sebelumnya");
  });
});
