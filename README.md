# Fokus Kerja

Pencatat durasi browsing, pemblokir distraksi, dan review fokus berbasis Claude. Ekstensi Chrome mencatat waktu di tab aktif dan memblokir domain saat kuota habis; dashboard Next.js menampilkan tren, anggaran fokus, insight deterministik, serta usulan perubahan yang selalu membutuhkan persetujuan pengguna.

Versi repo dan ekstensi: **1.4.0**. Lihat [changelog](CHANGELOG.md) dan [paket ekstensi](public/downloads/fokus-kerja-v1.4.0.zip).

## Status rilis

Kode Claude Focus Review dan paket ekstensi tersedia di repo. Ini **bukan bukti** bahwa migrasi, konfigurasi Claude, deployment, atau publikasi Chrome Web Store sudah selesai. Sebelum mengaktifkan fitur di environment tujuan, ikuti [production release gate](#production-release-gate) dan [checklist toko](store/chrome-web-store.md#review-checklist).

Situs aplikasi: https://focus-tracker-one-wheat.vercel.app

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

### Dashboard lokal

Prasyarat: **Node.js 22** (sesuai CI), npm, dan proyek Supabase. Dashboard bisa dijalankan tanpa ekstensi; pencatatan durasi dan pemblokiran membutuhkan ekstensi yang terhubung.

1. Untuk database baru, jalankan [`database/schema.sql`](database/schema.sql) di Supabase SQL Editor. Untuk database yang sudah dipakai, ikuti urutan migrasi di bawah.
2. Salin [`.env.example`](.env.example) ke `.env.local`, lalu isi variabel pada tabel berikut. Jangan commit `.env.local` atau kredensial privat.
3. Di Supabase Auth → URL Configuration, gunakan URL aplikasi yang sesuai dan izinkan callback `http://localhost:3000/auth/callback` untuk pengembangan. Deployment memakai callback pada origin deployment sendiri.
4. Install dependensi dari lockfile dan jalankan dashboard:

```bash
npm ci
npm run dev
```

5. Buka `http://localhost:3000/login`, daftar atau masuk, lalu konfirmasi email jika diwajibkan oleh konfigurasi Supabase.

### Variabel lingkungan

| Variabel | Kebutuhan | Kegunaan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Wajib untuk dashboard | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Wajib untuk dashboard | Anon/publishable key; bukan service-role key |
| `NEXT_PUBLIC_APP_URL` | Sesuai environment | Origin aplikasi untuk callback email; default `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | Hanya untuk Focus Review | Kredensial Claude di server, termasuk environment deployment bila fitur diaktifkan |
| `CLAUDE_MODEL` | Opsional | Model Claude; default `claude-sonnet-5-5` |
| `DATABASE_URL` | Hanya untuk status/migrasi database | Connection string Session pooler; tidak dibutuhkan dashboard saat runtime |

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` juga didukung bila `NEXT_PUBLIC_SUPABASE_ANON_KEY` tidak didefinisikan. Jangan memberi prefix `NEXT_PUBLIC_` pada `ANTHROPIC_API_KEY` atau `DATABASE_URL`. Tanpa API key Claude, fitur non-AI tetap dapat digunakan setelah schema dan autentikasi Supabase siap; pembuatan review AI belum tersedia.

### Ekstensi dan sinkronisasi sesi

1. Ekstrak paket ZIP, atau gunakan folder `extension/` dari repo.
2. Buka `chrome://extensions` → Developer mode → Load unpacked → pilih folder yang berisi `manifest.json`.
3. Masuk ke dashboard pada **profil browser yang sama**, lalu gunakan **Masuk & Sinkronkan** di popup. Setelah terhubung, periksa heartbeat dan antrean di dashboard.

**Ekstensi bawaan menunjuk ke situs produksi**, bukan `localhost`. Mengubah `.env.local` hanya mengubah dashboard, bukan konfigurasi ekstensi. Untuk menguji dashboard lokal atau deployment sendiri, gunakan salinan ekstensi di profil pengembangan:

- Ubah `DEFAULT_DASHBOARD` di `extension/background.js` ke origin target, misalnya `http://localhost:3000`.
- Sesuaikan `host_permissions` di `extension/manifest.json` dengan origin tersebut (`http://localhost:3000/*`) dan URL proyek Supabase yang dipakai (`https://<project-ref>.supabase.co/*`).
- Muat atau reload salinan ekstensi setelah perubahan, lalu masuk dan sinkronkan lagi. Jangan publikasikan paket yang masih memakai konfigurasi pengembangan.

Sesi diambil dari `/api/extension/session` pada tab dashboard. Cookie dan penyimpanan ekstensi terpisah antarprofil browser; login di profil lain tidak memperbarui sesi ekstensi ini.

## Paket ekstensi

Paket siap-pasang dibangun ulang dari folder `extension/`:

```bash
npm run package:extension
```

Script menulis `public/downloads/fokus-kerja-v<versi-manifest>.zip` secara deterministik — entri diurutkan, timestamp tetap, tanpa dependency npm atau binary eksternal — lalu mencetak jumlah entri, ukuran, dan SHA-256 sehingga paket yang dipublikasikan bisa diverifikasi ulang kapan saja.

Untuk rilis baru, samakan versi di `package.json`, metadata root `package-lock.json`, `extension/manifest.json`, dan `src/lib/release.ts`, lalu bangun ulang ZIP. Paket versi lama tetap disimpan agar tautan unduhan yang sudah dibagikan tidak terputus.

## Production release gate

Terapkan migrasi ke database tujuan **sebelum** men-deploy kode yang membacanya. Urutan yang dipakai: migrasi dulu, baru deploy.

Migrasi dijalankan dari terminal, tanpa membuka SQL Editor:

```bash
npm run db:status -- --list # daftar file lokal; tidak terhubung ke database
npm run db:status          # status/pratinjau; tidak menerapkan file migrasi
npm run db:push            # MENERAPKAN migrasi yang belum tercatat
```

**`npm run db:push` bukan dry-run.** Script npm sudah menyertakan `--apply`, sehingga tidak perlu menambahkannya lagi. Periksa database tujuan dan hasil `db:status` sebelum menjalankan perintah ini.

Script membaca `DATABASE_URL` dari environment terminal, kemudian `.env.local` dan `.env` tanpa menimpa nilai yang sudah ada. Ambil dari Supabase Dashboard → **Project Settings → Database → Connection string → Session pooler (URI)**; pakai port `5432`, bukan Transaction pooler `6543`, karena DDL butuh sesi tetap.

`db:status` tidak menjalankan file migrasi, tetapi tetap mengambil advisory lock dan membuat tabel `public.schema_migrations` bila belum ada. Jadi perintah ini **bukan pemeriksaan read-only**. Gunakan `db:status -- --list` jika hanya ingin melihat daftar file tanpa akses database.

Runner mencatat setiap versi setelah SQL berhasil. File yang sudah tercatat dilewati; penerapan manual melalui SQL Editor tidak otomatis tercatat. Status `BELUM` berarti belum ada catatan runner, bukan bukti bahwa tabelnya tidak ada. Migrasi yang tersedia bersifat idempoten; bila SQL berhasil tetapi pencatatan versi gagal, jalankan `npm run db:push` kembali setelah memeriksa penyebabnya.

<details>
<summary>Cara lama: tempel manual di SQL Editor</summary>

Buka Supabase Dashboard → SQL Editor, tempel isi file dari tabel di bawah, jalankan berurutan.

</details>

| Migrasi | Dibutuhkan oleh |
| --- | --- |
| `database/migrations/20260828_release_readiness.sql` | `rules.active`, tabel `extension_status` |
| `database/migrations/20260913_focus_budget.sql` | tabel `focus_settings` (anggaran fokus harian) |
| `database/migrations/20261008_claude_focus_review.sql` | tabel review, tindakan, RLS, dan RPC penerapan atomik |

Verifikasi schema lewat query yang terautentikasi atau probe PostgREST tersanitasi: tabel/kolom harus tersedia tanpa `PGRST205` atau `42703`, kontrol akses yang sudah ada tetap bekerja, dan RPC `apply_focus_review_action` tersedia sebelum Focus Review digunakan. Jangan cetak token, connection string, atau data pengguna ke log verifikasi.

Sebelum menyatakan rilis siap digunakan:

- Jalankan lint, typecheck, test, audit dependency produksi, build, dan pembuatan ZIP seperti pada bagian perintah.
- Verifikasi alur terautentikasi: login, sinkronisasi ekstensi, heartbeat, pencatatan tab aktif, dan overlay saat kuota domain habis.
- Pastikan anggaran fokus tampil konsisten di dashboard/popup dan **tidak** memblokir situs; uji filter rentang dan unduhan CSV.
- Untuk Claude, konfigurasi key server-side, buat satu review nyata setelah persetujuan, lalu terapkan satu usulan dan verifikasi perubahan kuota/anggaran. Build atau unit test saja tidak membuktikan integrasi ini hidup.
- Periksa halaman `/privacy`, `/panduan`, dan unduhan ZIP pada deployment tujuan, lalu selesaikan checklist toko sebelum pengajuan. Bukti lokal atau CI tidak berarti ekstensi sudah terbit di Chrome Web Store.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build dashboard produksi |
| `npm start` | Menjalankan hasil build produksi |
| `npm test` | Suite test yang terdaftar di `package.json` |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run lint` | Pemeriksaan ESLint |
| `npm audit --omit=dev` | Audit dependency produksi pada saat dijalankan |
| `npm run package:extension` | Membangun ZIP sesuai versi manifest |
| `npm run db:status -- --list` | Daftar migrasi lokal, tanpa koneksi database |
| `npm run db:status` | Status/pratinjau migrasi; dapat membuat tabel pelacakan |
| `npm run db:push` | Menerapkan migrasi yang belum tercatat |

CI di [`.github/workflows/ci.yml`](.github/workflows/ci.yml) menjalankan `npm ci`, lint, typecheck, test, audit produksi, dan build pada push/PR ke `main`. CI memakai konfigurasi Supabase placeholder, bukan bukti akses database produksi atau keberhasilan panggilan Claude.

## Catatan arsitektur

- Dashboard adalah Next.js; pencatatan dan pemblokiran hidup di ekstensi.
- Semua tabel per-pengguna dan dilindungi RLS; increment memakai RPC agar bebas race.
- Ekstensi menyinkronkan sesi dengan menjalankan fetch same-origin di tab dashboard, lalu memakai token itu untuk PostgREST.
- Next.js 16 memakai `src/proxy.ts` (middleware berganti nama menjadi proxy) dan mengirim `searchParams`/`params` sebagai Promise — keduanya wajib di-`await`.
- Parameter `next` pada halaman login disaring dengan `safeNextPath` agar hanya path same-origin yang diterima.
- Claude dipanggil hanya dari Route Handler Node.js dengan API key server-side; client tidak pernah menerima kredensial.
- `focus_reviews.input_snapshot` menyimpan ringkasan agregat untuk audit; `focus_review_actions` menyimpan status pending/applied/dismissed.
- Model menghasilkan JSON terstruktur melalui SDK resmi; domain tindakan divalidasi ulang terhadap domain yang memang ada di snapshot.
- RPC `apply_focus_review_action` menerapkan satu usulan dalam transaksi database dan tidak memberi Claude akses langsung untuk mengubah data.

## Dokumentasi lanjutan

- [Changelog](CHANGELOG.md): perubahan per versi.
- [Chrome Web Store](store/chrome-web-store.md): metadata, permission, aset, dan checklist pengajuan.
- [Materi Claude Startups](docs/claude-startups-application.md): aliran data dan materi teknis; data bisnis harus diisi dari fakta pemilik produk, bukan ditebak dari kode.
