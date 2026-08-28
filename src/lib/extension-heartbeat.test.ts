import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHeartbeatRecord } from "../../extension/lib.js";

describe("buildHeartbeatRecord", () => {
  it("writes the connection status instead of the runtime state object", () => {
    const record = buildHeartbeatRecord({
      userId: "user-1",
      status: "connected",
      extensionVersion: "1.2.0",
      manifestVersion: "3",
      pendingSyncCount: 2,
      now: new Date("2026-08-28T04:00:00.000Z"),
    });

    assert.equal(record?.state, "connected");
    assert.equal(record?.user_id, "user-1");
    assert.equal(record?.pending_sync_count, 2);
    assert.equal(record?.last_seen_at, "2026-08-28T04:00:00.000Z");
  });

  it("bounds and redacts heartbeat errors", () => {
    const record = buildHeartbeatRecord({
      userId: "user-1",
      status: "error",
      lastError: `Bearer secret-token ${"x".repeat(200)}`,
    });

    assert.equal(record?.state, "error");
    assert.equal(record?.last_error?.includes("secret-token"), false);
    assert.equal(record?.last_error?.length, 160);
  });
});
