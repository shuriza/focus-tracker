# Fokus Kerja

Pencatat durasi browsing + pemblokir distraksi. Ekstensi Chrome mencatat waktu di tab aktif, memblokir domain saat kuota harian habis, dan menyimpan jejak ke Supabase. Dashboard Next.js menampilkan grafik 7 hari.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Supabase (Auth, Postgres, RLS)
- Recharts
- Chrome Extension Manifest V3

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

Paket ekstensi siap-pasang tersedia dari situs pada `/downloads/fokus-kerja-v1.1.0.zip`. Salin paket rilis baru ke `public/downloads/` saat menaikkan versi ekstensi.

## Perintah

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Cara kerja

- Service worker menandai tab aktif yang terlihat, bukan idle, dan bukan `chrome://`.
- Durasi dijumlah per domain per hari kalender perangkat.
- Aturan `youtube.com` berlaku juga untuk `m.youtube.com`.
- Saat kuota habis, content script menempel overlay motivasi di halaman itu.
- Sinkron: ekstensi menjalankan fetch same-origin di tab dashboard, lalu RPC `increment_daily_time`.
