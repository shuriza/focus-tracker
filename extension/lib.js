export function normalizeDomain(input) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";
  let host = raw.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split(":")[0];
  host = host.replace(/^www\./, "");
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return "";
  if (!host.includes(".")) return "";
  return host;
}

export function domainMatches(hostname, ruleDomain) {
  const host = normalizeDomain(hostname);
  const rule = normalizeDomain(ruleDomain);
  if (!host || !rule) return false;
  return host === rule || host.endsWith(`.${rule}`);
}

export function isTrackableUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return Boolean(normalizeDomain(parsed.hostname));
  } catch {
    return false;
  }
}

export function todayISO(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${hours}j ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

export const QUOTES = [
  "Batas hari ini sudah terpakai. Kembali ke pekerjaan yang kamu janjikan pada dirimu sendiri.",
  "Fokus bukan larangan. Ini janji: waktu tersisa untuk kerja yang penting.",
  "YouTube bisa menunggu. Draft, tiket, atau tugasmu tidak.",
  "Istirahat yang direncanakan lebih baik daripada scroll yang tidak berujung.",
  "Kamu sudah cukup melihat. Sekarang selesaikan satu hal kecil.",
  "Durasi habis bukan hukuman. Itu pengingat bahwa harimu punya kuota.",
  "Kalau masih ingin membuka situs ini, tulis dulu apa yang harus selesai dulu.",
  "Perhatianmu mahal. Jangan habiskan untuk timeline yang tidak ingat namamu.",
];

export function quoteForDomain(domain, dateISO) {
  const seed = `${domain}:${dateISO}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return QUOTES[hash % QUOTES.length];
}

export function findRule(domain, rules) {
  return (rules ?? []).find((rule) => domainMatches(domain, rule.domain)) ?? null;
}

export function isRuleEnforced(rule, now = new Date()) {
  const start = rule?.active_start_hour;
  const end = rule?.active_end_hour;
  if (start == null || end == null) return true;
  const hour = now.getHours();
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
