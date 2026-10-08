# Fokus Kerja

Pencatat durasi browsing, pemblokir distraksi, dan review fokus berbasis Claude. Ekstensi Chrome mencatat waktu di tab aktif dan memblokir domain saat kuota habis; dashboard Next.js menampilkan tren, anggaran fokus, insight deterministik, serta usulan perubahan yang selalu membutuhkan persetujuan pengguna.

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

### Claude Focus Review

Review fokus hanya berjalan setelah pengguna menyetujui pengiriman satu ringkasan. Server mengirim data agregat terbatas — domain teratas, durasi, kuota, dan tren — ke Claude melalui `ANTHROPIC_API_KEY`; isi halaman, URL lengkap, dan teks yang diketik tidak dikirim.

Claude mengembalikan review terstruktur berisi pola dan maksimal tiga usulan. Usulan `set_domain_limit` atau `set_daily_budget` disimpan sebagai tindakan `pending`; perubahan baru diterapkan setelah pengguna menekan **Terapkan**. RPC Supabase menjalankan penerapan secara atomik dan mengaktifkan kembali aturan domain yang dipilih.

### Filter rentang 7/14/30 hari

Rentang dipilih lewat query `?rentang=7|14|30` pada `/dashboard`; nilai lain jatuh ke 7 hari. Grafik, insight, dan pembanding periode sebelumnya semuanya mengikuti rentang aktif.

### Status ekstensi

Ekstensi mengirim heartbeat ke `extension_status`: versi, waktu heartbeat terakhir, sinkron terakhir, jumlah antrean lokal, dan pesan galat yang sudah disanitasi. Dashboard menerjemahkannya menjadi empat keadaan — tersambung, tertunda, offline, perlu perhatian.

### Ekspor CSV

`/api/export` mengirim 30 hari terakhir sebagai CSV ber-BOM (aman dibuka di Excel) berisi tanggal, domain, detik, menit, kategori, dan batas kuota.

## Setup

1. Buat proyek Supabase, lalu jalankan `database/schema.sql` di SQL editor.
2. Salin `.env.example` ke `.env.local` dan isi URL + anon/publishable key.
3. Untuk mengaktifkan Claude Focus Review, isi `ANTHROPIC_API_KEY` di `.env.local`. `CLAUDE_MODEL` opsional; default-nya `claude-sonnet-5-5`. Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk API key ini.
4. Install dan jalankan dashboard:

```bash
npm install
npm run dev
```

5. Untuk penggunaan lokal, buka `chrome://extensions` → Developer mode → Load unpacked → pilih folder `extension/`.
6. Daftar/masuk di `http://localhost:3000/login`.
7. Setelah login, ekstensi menyinkronkan sesi otomatis. Tombol **Masuk & Sinkronkan** di popup dapat dipakai untuk menghubungkan ulang akun.

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
| `database/migrations/20261008_claude_focus_review.sql` | tabel review, tindakan, RLS, dan RPC penerapan atomik |

Verifikasi aman dilakukan lewat schema/query yang terautentikasi atau probe PostgREST yang sudah disanitasi:
- endpoint baru tidak lagi mengembalikan `PGRST205` atau `42703`;
- akses kontrol aturan yang sudah ada tetap bisa dijangkau;
- hasil probe hanya memeriksa keberadaan kolom/tabel dan respons autentikasi, bukan nilai rahasia atau data produksi.
- migrasi `20261008_claude_focus_review.sql` dan fungsi RPC `apply_focus_review_action` tersedia sebelum UI AI diaktifkan;

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
- Claude dipanggil hanya dari Route Handler Node.js dengan API key server-side; client tidak pernah menerima kredensial.
- `focus_reviews.input_snapshot` menyimpan ringkasan agregat untuk audit; `focus_review_actions` menyimpan status pending/applied/dismissed.
- Model menghasilkan JSON terstruktur melalui SDK resmi; domain tindakan divalidasi ulang terhadap domain yang memang ada di snapshot.
- RPC `apply_focus_review_action` menerapkan satu usulan dalam transaksi database dan tidak memberi Claude akses langsung untuk mengubah data.
