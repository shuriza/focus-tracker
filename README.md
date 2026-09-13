# Fokus Kerja

Pencatat durasi browsing + pemblokir distraksi. Ekstensi Chrome mencatat waktu di tab aktif, memblokir domain saat kuota harian habis, dan menyimpan jejak ke Supabase. Dashboard Next.js menampilkan tren pemakaian, anggaran fokus harian, dan insight otomatis.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Supabase (Auth, Postgres, RLS)
- Recharts
- Chrome Extension Manifest V3

## Fitur

### Jejak durasi per domain

Service worker menandai tab aktif yang terlihat, bukan idle, dan bukan `chrome://`. Durasi dijumlah per domain per hari kalender perangkat, lalu dikirim ke Supabase lewat RPC `increment_daily_time` yang atomik.

### Kuota per domain

Aturan di `/dashboard/aturan` membatasi satu domain beserta subdomainnya — `youtube.com` mencakup `m.youtube.com`. Setiap aturan punya kategori, status aktif/nonaktif, dan jendela jam opsional (`active_start_hour`–`active_end_hour`; keduanya kosong berarti sepanjang hari). Saat kuota habis, content script menempel overlay motivasi di halaman itu.

### Anggaran fokus harian

Satu batas lintas-domain untuk total waktu browsing per hari, terpisah dari kuota per domain. Diatur di `/dashboard/aturan`, disimpan di tabel `focus_settings` (15–1440 menit; mengosongkan input mematikan anggaran). Dashboard menampilkan kartu progres dengan nada warna berjenjang: aman di bawah 75%, waspada pada 75–100%, terlampaui di atas 100%. Anggaran hanya memberi sinyal — ia tidak memblokir situs, karena pemblokiran tetap milik kuota per domain.

### Insight otomatis

Dashboard meringkas rentang aktif menjadi maksimal empat insight berprioritas: status anggaran, domain dominan beserta porsinya, tren total dibanding periode sebelumnya, dan kepatuhan kuota. Semuanya dihitung dari data yang sama dengan grafik, tanpa panggilan jaringan tambahan.

### Filter rentang 7/14/30 hari

Rentang dipilih lewat query `?rentang=7|14|30` pada `/dashboard`; nilai lain jatuh ke 7 hari. Grafik, insight, dan pembanding periode sebelumnya semuanya mengikuti rentang aktif.

### Status ekstensi

Ekstensi mengirim heartbeat ke `extension_status`: versi, waktu heartbeat terakhir, sinkron terakhir, jumlah antrean lokal, dan pesan galat yang sudah disanitasi. Dashboard menerjemahkannya menjadi empat keadaan — tersambung, tertunda, offline, perlu perhatian.

### Ekspor CSV

`/api/export` mengirim 30 hari terakhir sebagai CSV ber-BOM (aman dibuka di Excel) berisi tanggal, domain, detik, menit, kategori, dan batas kuota.

## Setup

1. Buat proyek Supabase, lalu jalankan `database/schema.sql` di SQL editor.
2. Salin `.env.example` ke `.env.local` dan isi URL + anon/publishable key.
3. Install dan jalankan dashboard:

```bash
npm install
npm run dev
```

4. Untuk penggunaan lokal, buka `chrome://extensions` → Developer mode → Load unpacked → pilih folder `extension/`.
5. Daftar/masuk di `http://localhost:3000/login`.
6. Setelah login, ekstensi menyinkronkan sesi otomatis. Tombol **Masuk & Sinkronkan** di popup dapat dipakai untuk menghubungkan ulang akun.

## Paket ekstensi

Paket siap-pasang dibangun ulang dari folder `extension/`:

```bash
npm run package:extension
```

Script menulis `public/downloads/fokus-kerja-v<versi-manifest>.zip` secara deterministik — entri diurutkan, timestamp tetap, tanpa dependency npm atau binary eksternal — lalu mencetak jumlah entri, ukuran, dan SHA-256 sehingga paket yang dipublikasikan bisa diverifikasi ulang kapan saja.

## Production release gate

Terapkan migrasi ke database tujuan **sebelum** men-deploy kode yang membacanya. Urutan yang dipakai: migrasi dulu, baru deploy.

| Migrasi | Dibutuhkan oleh |
| --- | --- |
| `database/migrations/20260828_release_readiness.sql` | `rules.active`, tabel `extension_status` |
| `database/migrations/20260913_focus_budget.sql` | tabel `focus_settings` (anggaran fokus harian) |

Verifikasi aman dilakukan lewat schema/query yang terautentikasi atau probe PostgREST yang sudah disanitasi:
- endpoint baru tidak lagi mengembalikan `PGRST205` atau `42703`;
- akses kontrol aturan yang sudah ada tetap bisa dijangkau;
- hasil probe hanya memeriksa keberadaan kolom/tabel dan respons autentikasi, bukan nilai rahasia atau data produksi.

## Perintah

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
npm run package:extension
```

## Catatan arsitektur

- Dashboard adalah Next.js; pencatatan dan pemblokiran hidup di ekstensi.
- Semua tabel per-pengguna dan dilindungi RLS; increment memakai RPC agar bebas race.
- Ekstensi menyinkronkan sesi dengan menjalankan fetch same-origin di tab dashboard, lalu memakai token itu untuk PostgREST.
- Next.js 16 memakai `src/proxy.ts` (middleware berganti nama menjadi proxy) dan mengirim `searchParams`/`params` sebagai Promise — keduanya wajib di-`await`.
- Redirect setelah login disaring `safeNextPath`, sehingga hanya path same-origin yang diterima.
