/**
 * Next.js App Router delivers repeated query keys as arrays (`?edit=a&edit=b`).
 * Page components read a single scalar, so collapse to the first usable entry.
 */
export type SearchParamValue = string | string[] | undefined;

export function firstParam(value: SearchParamValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function findById<T extends { id: string }>(
  items: T[],
  value: SearchParamValue,
): T | null {
  const id = firstParam(value);
  if (!id) return null;
  return items.find((item) => item.id === id) ?? null;
}

/**
 * Only same-origin absolute paths may be used as a post-login redirect.
 * `//host` and `/\host` are protocol-relative URLs the browser resolves
 * off-origin, so they are rejected alongside absolute and relative URLs.
 */
export function safeNextPath(value: SearchParamValue, fallback = "/dashboard"): string {
  const candidate = firstParam(value);
  if (!candidate || !candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  return candidate;
}
