# Fokus Kerja — Chrome Web Store Readiness

Versi rilis yang disiapkan: **1.4.0**

## Metadata listing

| Field | Nilai |
| --- | --- |
| Nama | Fokus Kerja |
| Bahasa | Bahasa Indonesia |
| Kategori | Productivity |
| Situs web | https://focus-tracker-one-wheat.vercel.app |
| Kebijakan privasi | https://focus-tracker-one-wheat.vercel.app/privacy |
| Paket unduhan | https://focus-tracker-one-wheat.vercel.app/downloads/fokus-kerja-v1.4.0.zip |
| Jenis ekstensi | Chrome Extension Manifest V3 |
| Logo toko | `public/store/icon-128.png` |
| Screenshot | `public/store/screenshot-home-1280x800.png`, `public/store/screenshot-popup-1280x800.png`, `public/store/screenshot-guide-1280x800.png`, `public/store/screenshot-privacy-1280x800.png` |
| Promo kecil | `public/store/promo-small-440x280.png` |
| Marquee promo | `public/store/promo-marquee-1400x560.png` |

## Deskripsi singkat

Pencatat durasi browsing dan pemblokir distraksi. Atur kuota harian dan anggaran fokus, lihat insight otomatis, lalu kembali fokus.

## Deskripsi panjang

Fokus Kerja membantu kamu menjaga perhatian di Chrome tanpa alur yang rumit.

Ekstensi ini:
- mencatat durasi hanya saat tab aktif terlihat;
- menerapkan kuota harian per domain;
- memblokir situs saat batas tercapai dengan pengingat yang jelas;
- menampilkan progres anggaran fokus harian lintas-domain di popup;
- menyinkronkan aturan dan analitik ke dashboard Next.js;
- menampilkan status koneksi ekstensi di dashboard agar kamu tahu kapan sinkron terakhir berhasil;
- menyimpan state lokal secukupnya untuk antrian sinkron dan pemulihan sesi.

Anggaran fokus harian bersifat informatif: ia menandai total waktu browsing harianmu, sedangkan pemblokiran situs tetap hanya dipicu kuota per domain.

Semua data yang dikirim dirancang minimal, RLS-protected, dan tidak menyimpan token akses/refresh di heartbeat status.

## Penjelasan data & privasi

### Data yang dipakai
- Email akun: untuk autentikasi Supabase.
- Nama host/domain aktif: untuk mencocokkan aturan kuota.
- Durasi pemakaian per domain per hari: untuk dashboard dan kuota.
- Aturan kuota: domain, kategori, batas menit harian, dan jadwal aktif.
- Anggaran fokus harian: satu angka batas menit per hari milik pengguna.
- (Opsional) Ringkasan aktivitas agregat: hanya jika server dikonfigurasi dengan `ANTHROPIC_API_KEY` dan pengguna menyetujui Focus Review satu kali. Ringkasan berisi domain teratas, durasi, kuota, dan tren; tidak berisi isi halaman, URL lengkap, atau teks yang diketik.

### Data yang tidak dikumpulkan
- Konten halaman penuh.
- URL lengkap, query pencarian, atau teks yang diketik.
- Kredensial login selain sesi yang dibutuhkan untuk autentikasi.
- Token akses/refresh di status heartbeat.

### Cara data digunakan
- Menjalankan timer dan pemblokiran situs.
- Menampilkan grafik ringkasan di dashboard.
- Menampilkan progres anggaran fokus harian di popup dan dashboard.
- Menyinkronkan data antar perangkat milik pengguna yang sama.
- (Opsional) Menghasilkan ringkasan pola dan usulan kuota lewat Anthropic (Claude), hanya jika server dikonfigurasi dan pengguna menyetujui pengiriman ringkasan agregat.
- Menunjukkan status koneksi ekstensi agar pengguna tahu apakah sinkron berhasil.

### Penyimpanan & keamanan
- Data server disimpan di Supabase/Postgres dengan Row Level Security.
- Data lokal dipakai untuk antrian sinkron dan state sesi sementara.
- Error heartbeat dibatasi dan disanitasi sebelum disimpan.

### Pihak ketiga
- **Anthropic (Claude)** (opsional): hanya menerima ringkasan agregat jika server dikonfigurasi dengan `ANTHROPIC_API_KEY` dan pengguna menyetujui Focus Review satu per satu. Pengiriman tidak otomatis dan dapat diabaikan kapan saja. Usulan perubahan tidak pernah diterapkan tanpa tombol persetujuan di dashboard.
- **Supabase**: penyedia database dan autentikasi.

## Justifikasi permission

- `alarms`: menjalankan tick/sync berkala untuk pembaruan durasi dan status koneksi.
- `idle`: menghentikan pencatatan saat perangkat idle.
- `storage`: menyimpan state lokal, antrian sinkron, dan sesi sementara.
- `tabs`: membaca tab aktif, nama host, dan memantau perubahan tab.
- `scripting`: menyuntikkan skrip sinkron ke tab dashboard saat sesi perlu dihubungkan ulang.
- Host permission `https://focus-tracker-one-wheat.vercel.app/*`: akses dashboard, login, dan halaman publik aplikasi.
- Host permission `https://wtpvftqiiwldcxlpzykl.supabase.co/*`: akses REST/RPC Supabase untuk sinkron data pengguna yang terautentikasi.
- Content script pada `http://*/*` dan `https://*/*`: menampilkan overlay pemblokiran dan pesan motivasi pada domain yang sudah melebihi kuota.

## Instruksi pengujian

### Otomatis
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run package:extension` (paket ZIP deterministik; SHA-256 dicetak untuk verifikasi)

### Manual
1. Muat folder `extension/` di Chrome dengan Developer mode.
2. Buka situs aktif dan pastikan timer hanya bertambah saat tab terlihat.
3. Uji sinkron sesi lewat popup ekstensi.
4. Buka dashboard dan pastikan status koneksi menampilkan heartbeat terbaru.
5. Pastikan situs yang melebihi kuota menampilkan overlay blokir.
6. Atur anggaran fokus harian di `/dashboard/aturan`, lalu pastikan popup ekstensi dan dashboard menampilkan progres yang sama.
7. Pastikan melampaui anggaran TIDAK memblokir situs; hanya kuota per domain yang memblokir.
8. Unduh paket ZIP dan verifikasi nama file `fokus-kerja-v1.4.0.zip`.

## Review checklist

Centang hanya membuktikan bagian yang disebutkan. Dimensi aset tidak membuktikan keterbacaan atau kesesuaian screenshot; build lokal tidak membuktikan akses publik atau kesiapan fitur di produksi. Verifikasi ulang gate produksi sebelum pengajuan.

- [x] Versi manifest di `extension/manifest.json` sudah `1.4.0`.
- [x] Konfigurasi unduhan di repo mengarah ke `/downloads/fokus-kerja-v1.4.0.zip`.
- [ ] ZIP v1.4.0 dapat diunduh dari deployment tujuan dan cocok dengan paket lokal.
- [ ] Migrasi `database/migrations/20260913_focus_budget.sql` sudah diterapkan sebelum deploy.
- [ ] Migrasi `database/migrations/20261008_claude_focus_review.sql` sudah diterapkan sebelum UI review AI diaktifkan.
- [x] ZIP hanya berisi file runtime ekstensi yang diperlukan.
- [ ] Isi ZIP sudah diperiksa bebas kredensial privat; pemeriksaan nama file saja tidak cukup.
- [x] Dimensi logo toko 128x128.
- [ ] Logo tetap terbaca di latar terang dan gelap melalui pemeriksaan visual.
- [x] Dimensi empat screenshot 1280x800.
- [ ] Screenshot diverifikasi secara visual sesuai pengalaman rilis yang akan diajukan.
- [x] Promo kecil 440x280 tersedia.
- [x] Marquee 1400x560 tersedia bila ingin fitur promosi ekstra.
- [ ] Kebijakan privasi publik dapat diakses di `/privacy` pada deployment tujuan.
- [x] Teks listing menjelaskan data yang dikumpulkan secara jujur.
- [ ] Fitur yang disebut di listing telah diverifikasi pada environment rilis, bukan hanya tersedia dalam kode.
- [ ] Semua verifikasi otomatis dijalankan kembali dan lulus sebelum pengajuan.
