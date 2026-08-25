import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <main className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke beranda
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Fokus<span className="text-blue-600">Kerja</span>
            </span>
            <p className="text-xs text-slate-500 font-medium">Kebijakan Privasi</p>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Kebijakan Privasi
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Berlaku untuk situs web dan ekstensi browser Fokus Kerja.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <Section title="Data yang kami kumpulkan">
            <p>
              Fokus Kerja mengumpulkan data minimal yang diperlukan agar fitur berfungsi:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Alamat email</strong> — dipakai untuk masuk ke akun melalui Supabase Auth.
              </li>
              <li>
                <strong>Durasi aktivitas per domain</strong> — total waktu yang kamu habiskan di
                setiap domain (mis. <code>youtube.com</code>) per hari, dihitung hanya saat tab
                aktif terlihat dan perangkat tidak dalam kondisi idle.
              </li>
              <li>
                <strong>Aturan kuota</strong> — daftar domain, batas menit harian, kategori, dan
                jadwal blokir yang kamu tetapkan.
              </li>
            </ul>
          </Section>

          <Section title="Apa yang TIDAK kami kumpulkan">
            <ul className="list-disc space-y-1 pl-5">
              <li>Konten halaman yang kamu buka.</li>
              <li>URL lengkap, permintaan pencarian, atau teks yang kamu ketik.</li>
              <li>Data keuangan, lokasi GPS, kontak, atau riwayat penjelajahan penuh.</li>
            </ul>
            <p>
              Ekstensi hanya membaca nama host (domain) dari tab aktif untuk mencocokkan dengan
              aturanmu.
            </p>
          </Section>

          <Section title="Bagaimana data digunakan">
            <ul className="list-disc space-y-1 pl-5">
              <li>Menampilkan grafik mingguan dan rekap durasi di akunmu.</li>
              <li>Menerapkan kuota harian dan memblokir situs saat batas habis.</li>
              <li>Sinkronisasi aturan antar perangkat yang memakai akun yang sama.</li>
            </ul>
          </Section>

          <Section title="Penyimpanan & keamanan">
            <p>
              Data disimpan di Postgres lewat Supabase dengan <em>Row Level Security</em>: setiap
              pengguna hanya dapat mengakses baris miliknya sendiri. Status sementara juga disimpan
              secara lokal di <code>chrome.storage.local</code> pada browsermu.
            </p>
          </Section>

          <Section title="Berbagi data">
            <p>
              Kami tidak menjual, menyewakan, atau membagikan data pribadimu kepada pihak ketiga.
              Data tidak digunakan untuk iklan atau pelacakan lintas situs.
            </p>
          </Section>

          <Section title="Hakmu">
            <p>
              Kamu dapat menghapus seluruh aturan dan jejakmu kapan saja dari dashboard, atau
              menghapus akun melalui penyedia autentikasi (Supabase). Setelah dihapus, data tidak
              dapat dipulihkan.
            </p>
          </Section>

          <Section title="Perubahan">
            <p>
              Perubahan pada kebijakan ini akan diperbarui di halaman ini. Untuk pertanyaan terkait
              privasi, hubungi kami lewat tautan pada halaman beranda.
            </p>
          </Section>

          <p className="text-xs text-slate-400">
            Terakhir diperbarui: 23 Agustus 2026.
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}