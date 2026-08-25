export const CATEGORY_KEYS = [
  "sosial",
  "video",
  "berita",
  "belanja",
  "game",
  "lainnya",
] as const;

export type Category = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  sosial: "Sosial media",
  video: "Video & streaming",
  berita: "Berita",
  belanja: "Belanja",
  game: "Game",
  lainnya: "Lainnya",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  sosial: "#2563eb",
  video: "#0284c7",
  berita: "#0d9488",
  belanja: "#6366f1",
  game: "#8b5cf6",
  lainnya: "#64748b",
};

export function isCategory(value: string): value is Category {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

export function categoryLabel(value: string | null | undefined): string {
  if (!value || !isCategory(value)) return CATEGORY_LABELS.lainnya;
  return CATEGORY_LABELS[value];
}

export function categoryColor(value: string | null | undefined): string {
  if (!value || !isCategory(value)) return CATEGORY_COLORS.lainnya;
  return CATEGORY_COLORS[value];
}