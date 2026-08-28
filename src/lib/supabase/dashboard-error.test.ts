import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeDashboardDataError } from "./dashboard-error";

describe("describeDashboardDataError", () => {
  it("offers session recovery for future-issued JWTs", () => {
    const view = describeDashboardDataError("JWT issued at future");

    assert.equal(view.kind, "session");
    assert.equal(view.title, "Sesi perlu diperbarui");
    assert.match(view.guidance, /token baru/i);
  });

  it("shows migration guidance only for schema failures", () => {
    const view = describeDashboardDataError(
      "Could not find the table 'public.extension_status' in the schema cache",
      "PGRST205",
    );

    assert.equal(view.kind, "schema");
    assert.match(view.guidance, /20260828_release_readiness\.sql/);
  });

  it("does not mislabel generic failures as schema failures", () => {
    const view = describeDashboardDataError("Network request failed");

    assert.equal(view.kind, "generic");
    assert.doesNotMatch(view.guidance, /migration|schema/i);
  });
});
