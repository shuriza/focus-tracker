import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findById, firstParam, safeNextPath } from "./search-params";

describe("firstParam", () => {
  it("collapses repeated query keys to the first usable entry", () => {
    assert.equal(firstParam(["youtube", "x"]), "youtube");
    assert.equal(firstParam("  x  "), "x");
  });

  it("treats blank and missing values as absent", () => {
    assert.equal(firstParam(undefined), undefined);
    assert.equal(firstParam(""), undefined);
    assert.equal(firstParam("   "), undefined);
    assert.equal(firstParam([]), undefined);
    assert.equal(firstParam(["", "x"]), undefined);
  });
});

describe("findById", () => {
  const rules = [{ id: "a1" }, { id: "b2" }];

  it("resolves a rule from a scalar or repeated query value", () => {
    assert.equal(findById(rules, "b2"), rules[1]);
    assert.equal(findById(rules, ["a1", "b2"]), rules[0]);
  });

  it("returns null for unknown or absent ids", () => {
    assert.equal(findById(rules, "zz"), null);
    assert.equal(findById(rules, undefined), null);
    assert.equal(findById(rules, "  "), null);
  });
});

describe("safeNextPath", () => {
  it("keeps same-origin absolute paths", () => {
    assert.equal(safeNextPath("/dashboard/aturan"), "/dashboard/aturan");
    assert.equal(safeNextPath("/dashboard?rentang=30"), "/dashboard?rentang=30");
  });

  it("rejects off-origin and relative redirects", () => {
    assert.equal(safeNextPath("//evil.example"), "/dashboard");
    assert.equal(safeNextPath("/\\evil.example"), "/dashboard");
    assert.equal(safeNextPath("https://evil.example"), "/dashboard");
    assert.equal(safeNextPath("dashboard"), "/dashboard");
    assert.equal(safeNextPath(undefined), "/dashboard");
  });
});
