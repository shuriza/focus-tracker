export type DashboardDataErrorKind = "session" | "schema" | "generic";

export type DashboardDataErrorView = {
  kind: DashboardDataErrorKind;
  title: string;
  guidance: string;
};

export function describeDashboardDataError(
  message: string,
  code?: string,
): DashboardDataErrorView {
  if (/\bJWT\b/i.test(message)) {
    return {
      kind: "session",
      title: "Sesi perlu diperbarui",
      guidance:
        "Token sesi ini tidak diterima. Perbarui sesi untuk meminta token baru; jika gagal, kamu akan diminta masuk kembali.",
    };
  }

  if (
    code === "PGRST205" ||
    code === "42703" ||
    /could not find the table|column .* does not exist/i.test(message)
  ) {
    return {
      kind: "schema",
      title: "Skema database belum siap",
      guidance:
        "Jalankan database/migrations/20260828_release_readiness.sql di proyek Supabase tujuan sebelum memuat ulang halaman.",
    };
  }

  return {
    kind: "generic",
    title: "Gagal memuat data analitik",
    guidance: "Muat ulang halaman. Jika masalah berlanjut, periksa koneksi Supabase.",
  };
}
