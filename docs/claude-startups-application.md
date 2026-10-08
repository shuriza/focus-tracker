# Aplikasi Claude Startups — Materi Pendukung

Formulir: https://platform.claude.com/offers/startups-application
Program: https://claude.com/programs/startups
Syarat resmi: https://www.anthropic.com/startup-program-official-terms

> Berkas ini hanya berisi fakta yang ada di repositori ini. Bagian bertanda
> **ISI SENDIRI** tidak bisa dijawab dari kode — itu data bisnis yang hanya
> Anda yang tahu.

## Kelayakan (dari artikel pengumuman 6 Oktober 2026)

- Startup didirikan dalam 5 tahun terakhir, **atau** mendapat pendanaan dalam 2 tahun terakhir.
- Tidak beroperasi di, dan tidak menyediakan layanan ke: Belarus, China, Kuba, Iran, Myanmar,
  Korea Utara, Rusia, Sudan, Suriah, Crimea, DPR Donetsk, DPR Lugansk.
- Bukan karyawan/pejabat/agen Anthropic dan keluarga dekatnya.
- **ISI SENDIRI**: tanggal pendirian entitas, tanggal pendanaan terakhir, negara operasi.

## Manfaat yang relevan untuk Fokus Kerja
| Manfaat | Nilai | Relevansi |
| --- | --- | --- |
| Kredit API Claude | $1.000 sekali | Langsung membiayai pemanggilan Claude Focus Review |
| Claude Team | 1 tahun, hingga 5 kursi Premium | Pengembangan tim |

Catatan dari syarat resmi §6: kredit dikaitkan ke akun **perusahaan** yang disebut di
formulir, bukan akun pribadi. Pastikan organisasi Console yang dipakai sesuai.

## Bagaimana Claude dipakai di Fokus Kerja

Ini inti aplikasi: bukan sekadar "memakai API", tapi integrasi yang spesifik dan
berpagar. Semua pernyataan di bawah bisa diverifikasi dari kode.

### Aliran data

1. Pengguna mencentang persetujuan di dashboard, lalu menekan **Buat review fokus**.
2. Server menyusun ringkasan agregat (`src/lib/focus-review.ts:93`): periode berjalan vs
   pembanding, 8 domain teratas dengan durasi/porsi/kuota/kategori, total harian, status
   anggaran, dan jumlah aturan aktif.
3. Ringkasan dikirim ke Claude lewat Route Handler Node.js
   (`src/lib/claude/focus-review.ts`) memakai `messages.parse` + `zodOutputFormat`,
   sehingga keluaran model dikunci skema.
4. Hasil terstruktur: ringkasan, maksimal 4 pola, maksimal 3 usulan perubahan kuota.
5. Usulan disimpan sebagai `pending`. Perubahan hanya diterapkan setelah pengguna
   menekan **Terapkan**, lewat RPC `apply_focus_review_action` yang atomik.

### Yang TIDAK dikirim

Isi halaman, URL lengkap, permintaan pencarian, dan teks yang diketik. Snapshot tidak
memuat `user_id` — ini diuji di `src/lib/focus-review.test.ts`.

### Pagar pengaman yang bisa disebut

- `sanitizeFocusReviewSuggestions` menolak usulan domain di luar `topDomains`,
  menormalkan URL menjadi host, membuang duplikat, dan memotong maksimal 3 usulan.
- API key hanya dibaca di sisi server (`src/lib/env.ts:35`), tidak pernah diekspos.
- Claude tidak pernah menulis langsung ke database. Jalurnya selalu lewat persetujuan
  pengguna dan RPC.
- `maxRetries: 0` dan timeout 30 detik; error 401/403, 429, dan timeout punya penanganan
  sendiri agar UI menampilkan pesan jelas, bukan kegagalan kosong.

## Pertanyaan formulir yang belum bisa saya jawab

- Nama perusahaan, situs, dan entitas hukum. **ISI SENDIRI**
- Deskripsi singkat produk (saran: pakai "Deskripsi singkat" di
  `store/chrome-web-store.md:23`). **ISI SENDIRI**
- Traksi: jumlah pengguna, pertumbuhan, pendapatan. **ISI SENDIRI**
- Pendanaan: investor, jumlah, tahap. **ISI SENDIRI**
- Mengapa memilih Claude daripada alternatif. **ISI SENDIRI** — tapi argumen teknisnya
  bisa ditarik dari bagian "Pagar pengaman" di atas.
- Rencana pemakaian kredit. Bisa dijawab: membiayai Focus Review untuk pengguna aktif,
  dengan biaya per review yang bisa diperkirakan dari `input_tokens`/`output_tokens`
  yang memang sudah dicatat di `focus_reviews`.

## Yang harus beres SEBELUM mendaftar

Program menilai "Claude integration and usage" (syarat §4). Menampilkan integrasi yang
belum berjalan akan merugikan aplikasi.

- [ ] `database/migrations/20260913_focus_budget.sql` diterapkan (`focus_settings` masih PGRST205).
- [ ] `database/migrations/20261008_claude_focus_review.sql` diterapkan (kedua tabel review masih PGRST205).
- [ ] `ANTHROPIC_API_KEY` terisi — kredit $1.000 dari program ini sumbernya.
- [ ] Satu review berhasil dibuat dan satu usulan berhasil diterapkan di produksi,
      sehingga ada bukti nyata bahwa integrasinya hidup.
