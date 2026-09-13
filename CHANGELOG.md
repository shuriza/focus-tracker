# Changelog

Semua perubahan penting pada Fokus Kerja dicatat di sini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id/1.1.0/), versi mengikuti
[Semantic Versioning](https://semver.org/lang/id/).

## [1.3.0] — 2026-09-13

### Ditambahkan

- **Anggaran fokus harian**: batas lintas-domain untuk total waktu browsing per hari,
  disimpan di tabel `focus_settings` (15–1440 menit, dapat dimatikan). Dashboard
  menampilkan kartu progres berjenjang (aman / waspada di 75% / terlampaui) dan
  formulirnya ada di `/dashboard/aturan`.
- **Insight otomatis**: hingga empat ringkasan berprioritas per rentang aktif —
  status anggaran, domain dominan, tren dibanding periode sebelumnya, dan
  kepatuhan kuota.
- **Filter rentang 7/14/30 hari** pada dashboard lewat `?rentang=`; grafik,
  insight, dan pembanding periode sebelumnya mengikuti rentang aktif.
- **Anggaran di popup ekstensi** (v1.3.0): progres pemakaian harian ditarik dari
  `focus_settings` saat sinkronisasi, tanpa permission baru.
- `scripts/package-extension.mjs` + `npm run package:extension`: pembangun ZIP
  rilis deterministik tanpa dependency npm atau binary eksternal, mencetak jumlah
  entri, ukuran, dan SHA-256.
- Migrasi `database/migrations/20260913_focus_budget.sql` (tabel `focus_settings`
  beserta index, RLS, policy, dan grant).

### Diperbaiki

- `searchParams` di `/dashboard/aturan` diketik dan dibaca sinkron, padahal
  Next.js 16 mengirimkannya sebagai Promise. Akibatnya tombol preset dan tautan
  "ubah" tidak pernah mengisi formulir. Kini di-`await` melalui helper
  `src/lib/search-params.ts` yang juga menangani query key berulang.
- Redirect setelah login menerima `//host`, yang diselesaikan browser sebagai URL
  lintas-origin. `safeNextPath` sekarang hanya meloloskan path same-origin.

### Keamanan

- Next.js dinaikkan ke 16.3.5 dan `sharp` ke ≥0.35.4 untuk menutup advisory
  upstream: RCE tanpa autentikasi pada server Windows (GHSA-p293-qw3h-jr36),
  RCE pada Image Optimization API untuk berkas AVIF (GHSA-2xp9-vwfh-vxw4), dan
  kerentanan libheif pada `sharp` (GHSA-rgj7-g3m4-5g8c). `npm audit --omit=dev`
  kini melaporkan 0 kerentanan.
- Anggaran fokus bersifat informatif; pemblokiran tetap hanya dipicu kuota
  per domain, sehingga tidak ada jalur pemblokiran baru yang bisa disalahgunakan.

## [1.2.0] — 2026-08-28

### Ditambahkan

- Status ekstensi di dashboard: heartbeat, sinkron terakhir, antrean lokal, dan
  galat tersanitasi dari tabel `extension_status`.
- Kontrol aturan lengkap: aktif/nonaktif, kategori, jendela jam, dan preset.
- Paket unduhan ekstensi dari situs beserta halaman panduan pemasangan.
- Workflow CI (lint, typecheck, test, audit, build).

### Diperbaiki

- Runtime heartbeat ekstensi dan pemulihan sesi JWT pada dashboard.
- Unduhan biner tidak lagi di-prefetch oleh Next.js.

## [1.0.0] — 2026-08-23

### Ditambahkan

- Dashboard Fokus Kerja: grafik tujuh hari, breakdown domain, ekspor CSV.
- Ekstensi Chrome Manifest V3: pencatatan tab aktif, kuota per domain, overlay
  pemblokir, sinkronisasi sesi dari tab dashboard.
- Schema Supabase dengan RLS per pengguna dan RPC `increment_daily_time`.
