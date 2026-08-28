import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHeartbeatRecord,
  deriveExtensionConnectionState,
  sanitizeHeartbeatError,
  summarizeExtensionStatus,
} from "./extension-status";
import type { ExtensionStatus } from "./types";

function makeStatus(overrides: Partial<ExtensionStatus> = {}): ExtensionStatus {
  return {
    id: "status-1",
    user_id: "user-1",
    state: "connected",
    extension_version: "1.2.3",
    manifest_version: "3",
    last_seen_at: "2026-08-27T12:00:00.000Z",
    last_sync_at: "2026-08-27T12:00:00.000Z",
    pending_sync_count: 2,
    last_error: null,
    created_at: "2026-08-27T11:59:00.000Z",
    updated_at: "2026-08-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("deriveExtensionConnectionState", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("marks fresh heartbeats as connected", () => {
    assert.equal(deriveExtensionConnectionState(makeStatus(), now), "connected");
  });

  it("falls back to stale and offline by age", () => {
    const stale = makeStatus({ last_seen_at: "2026-08-27T11:54:00.000Z" });
    const offline = makeStatus({ last_seen_at: "2026-08-27T11:00:00.000Z" });

    assert.equal(deriveExtensionConnectionState(stale, now), "stale");
    assert.equal(deriveExtensionConnectionState(offline, now), "offline");
  });

  it("keeps explicit errors visible", () => {
    const error = makeStatus({ state: "error", last_error: "Network unavailable" });
    assert.equal(deriveExtensionConnectionState(error, now), "error");
  });
});

describe("heartbeat helpers", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("redacts bearer tokens", () => {
    assert.equal(sanitizeHeartbeatError("Bearer abc123"), "Bearer [redacted]");
  });

  it("builds a bounded heartbeat record for upsert", () => {
    const record = buildHeartbeatRecord({
      userId: "user-1",
      state: "error",
      extensionVersion: "1.2.3",
      manifestVersion: "3",
      pendingSyncCount: 7,
      lastSyncAt: "2026-08-27T11:58:00.000Z",
      lastError: "Too many requests",
      now,
    });

    assert.equal(record.user_id, "user-1");
    assert.equal(record.state, "error");
    assert.equal(record.pending_sync_count, 7);
    assert.equal(record.last_error, "Too many requests");
    assert.equal(record.last_sync_at, "2026-08-27T11:58:00.000Z");
    assert.equal(typeof record.last_seen_at, "string");
    assert.ok(record.last_seen_at.endsWith("Z"));
  });

  it("summarizes a dashboard-friendly status view", () => {
    const summary = summarizeExtensionStatus(makeStatus(), now);
    assert.equal(summary.state, "connected");
    assert.equal(summary.title, "Ekstensi tersambung");
    assert.equal(summary.tone, "emerald");
    assert.equal(summary.meta.includes("2 antrean"), true);
  });
});
