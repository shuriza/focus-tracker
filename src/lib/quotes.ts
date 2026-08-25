export const MOTIVATION_QUOTES = [
  "Batas hari ini sudah terpakai. Kembali ke pekerjaan yang kamu janjikan pada dirimu sendiri.",
  "Fokus bukan larangan. Ini janji: waktu tersisa untuk kerja yang penting.",
  "YouTube bisa menunggu. Draft, tiket, atau tugasmu tidak.",
  "Istirahat yang direncanakan lebih baik daripada scroll yang tidak berujung.",
  "Kamu sudah cukup melihat. Sekarang selesaikan satu hal kecil.",
  "Durasi habis bukan hukuman. Itu pengingat bahwa harimu punya kuota.",
  "Kalau masih ingin membuka situs ini, tulis dulu apa yang harus selesai dulu.",
  "Perhatianmu mahal. Jangan habiskan untuk timeline yang tidak ingat namamu.",
] as const;

export function quoteForDomain(domain: string, dateISO: string): string {
  const seed = `${domain}:${dateISO}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return MOTIVATION_QUOTES[hash % MOTIVATION_QUOTES.length];
}
