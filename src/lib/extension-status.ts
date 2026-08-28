import type { ExtensionStatus } from "./types";

export const CONNECTION_FRESHNESS_MS = 2 * 60 * 1000;
export const CONNECTION_STALE_MS = 10 * 60 * 1000;

export type ExtensionConnectionState = "connected" | "stale" | "offline" | "error";

export type HeartbeatRecordInput = {
  userId: string;
  state: "connected" | "error";
  extensionVersion: string;
  manifestVersion: string;
  pendingSyncCount: number;
  lastSyncAt?: string | null;
  lastError?: string | null;
  now?: Date;
};

export type ExtensionStatusSummary = {
  state: ExtensionConnectionState;
  title: string;
  message: string;
  meta: string;
  tone: "emerald" | "amber" | "slate" | "rose";
};

export function deriveExtensionConnectionState(
  status: Pick<ExtensionStatus, "state" | "last_seen_at" | "last_error"> | null | undefined,
  now = new Date(),
): ExtensionConnectionState {
  if (!status) return "offline";
  if (status.state === "error" && status.last_error) return "error";

  const lastSeenAt = Date.parse(status.last_seen_at);
  if (!Number.isFinite(lastSeenAt)) {
    return status.state === "error" ? "error" : "offline";
  }

  const age = now.getTime() - lastSeenAt;
  if (age <= CONNECTION_FRESHNESS_MS) return "connected";
  if (age <= CONNECTION_STALE_MS) return "stale";
  return "offline";
}

export function formatHeartbeatAge(value: string | null | undefined, now = new Date()): string {
  if (!value) return "Belum ada heartbeat";

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Belum ada heartbeat";

  const deltaMs = now.getTime() - timestamp;
  if (deltaMs <= 0) return "Baru saja";

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function sanitizeHeartbeatError(value: string | null | undefined, maxLength = 160): string | null {
  if (!value) return null;

  const redacted = value
    .replace(/\b(access_token|refresh_token|token|api[_-]?key|x-api-key|apikey)\b(\s*[:=]\s*)([^&\s]+)/gi, "$1$2[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim();

  if (!redacted) return null;
  return redacted.slice(0, maxLength);
}

export function buildHeartbeatRecord(input: HeartbeatRecordInput): Omit<ExtensionStatus, "id" | "created_at" | "updated_at"> {
  const now = input.now ?? new Date();
  const pendingSyncCount = Number.isFinite(input.pendingSyncCount)
    ? Math.max(0, Math.trunc(input.pendingSyncCount))
    : 0;

  return {
    user_id: input.userId,
    state: input.state,
    extension_version: String(input.extensionVersion || "unknown"),
    manifest_version: String(input.manifestVersion || "3"),
    last_seen_at: now.toISOString(),
    last_sync_at: input.lastSyncAt ?? null,
    pending_sync_count: pendingSyncCount,
    last_error: sanitizeHeartbeatError(input.lastError),
  };
}

export function summarizeExtensionStatus(
  status: ExtensionStatus | null | undefined,
  now = new Date(),
): ExtensionStatusSummary {
  const state = deriveExtensionConnectionState(status, now);
  const pending = Math.max(0, status?.pending_sync_count ?? 0);
  const version = status?.extension_version?.trim() || "unknown";
  const seen = formatHeartbeatAge(status?.last_seen_at, now);
  const synced = formatHeartbeatAge(status?.last_sync_at, now);

  switch (state) {
    case "connected":
      return {
        state,
        title: "Ekstensi tersambung",
        message: `Heartbeat ${seen}. Sinkron terakhir ${synced}.`,
        meta: `Versi ${version} · ${pending} antrean.`,
        tone: "emerald",
      };
    case "stale":
      return {
        state,
        title: "Ekstensi tertunda",
        message: `Heartbeat terakhir ${seen}. Sinkron terakhir ${synced}.`,
        meta: `Versi ${version} · ${pending} antrean.`,
        tone: "amber",
      };
    case "error":
      return {
        state,
        title: "Ekstensi perlu perhatian",
        message: status?.last_error ?? "Sinkronisasi terakhir gagal. Buka ekstensi dan coba lagi.",
        meta: `Versi ${version} · ${pending} antrean.`,
        tone: "rose",
      };
    case "offline":
    default:
      return {
        state,
        title: "Ekstensi offline",
        message: status ? `Tidak ada heartbeat baru sejak ${seen}.` : "Belum ada heartbeat dari ekstensi.",
        meta: `Versi ${version} · ${pending} antrean.`,
        tone: "slate",
      };
  }
}
