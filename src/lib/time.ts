export function normalizeDomain(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";

  let host = raw
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .split(":")[0];

  host = host.replace(/^www\./, "");
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }
  if (!host.includes(".")) return "";
  return host;
}

export function domainMatches(hostname: string, ruleDomain: string): boolean {
  const host = normalizeDomain(hostname);
  const rule = normalizeDomain(ruleDomain);
  if (!host || !rule) return false;
  return host === rule || host.endsWith(`.${rule}`);
}

export function isTrackableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return Boolean(normalizeDomain(parsed.hostname));
  } catch {
    return false;
  }
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function lastNDates(n: number, now = new Date()): string[] {
  return Array.from({ length: n }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - (n - 1 - index));
    return toISODate(d);
  });
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${rest}s`;
  }
  return `${rest}s`;
}

export function formatMinutes(minutes: number): string {
  const value = Math.max(0, minutes);
  const hours = Math.floor(value / 60);
  const rest = Math.round(value % 60);
  if (hours > 0) {
    return `${hours}j ${rest}m`;
  }
  return `${rest} mnt`;
}

export function weekdayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);
}

export function longDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
