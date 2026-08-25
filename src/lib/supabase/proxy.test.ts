import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicPath } from "./proxy";

describe("isPublicPath", () => {
  it("allows versioned extension downloads without a session", () => {
    assert.equal(isPublicPath("/downloads/fokus-kerja-v1.1.0.zip"), true);
  });

  it("keeps dashboard routes protected", () => {
    assert.equal(isPublicPath("/dashboard"), false);
    assert.equal(isPublicPath("/dashboard/aturan"), false);
  });
});
