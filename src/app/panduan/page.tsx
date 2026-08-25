import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Download, FolderOpen, Info, Puzzle, RefreshCw } from "lucide-react";

const EXTENSION_DOWNLOAD = "/downloads/fokus-kerja-v1.1.0.zip";

export const metadata: Metadata = {
  title: "Pasang ekstensi",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-[100px]" />
      </div>

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
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Fokus<span className="text-blue-600">Kerja</span>
            </span>
            <p className="text-xs text-slate-500 font-medium">Panduan Instalasi Ekstensi</p>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Pasang Pemblokir di Google Chrome
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Unduh paket ekstensi, pasang melalui mode developer Chrome, lalu hubungkan dengan akun Fokus Kerja.
        </p>

        <a
          href={EXTENSION_DOWNLOAD}
          download
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          Unduh Fokus Kerja v1.1.0
        </a>
        <p className="mt-2 text-xs font-medium text-slate-500">Paket ZIP · 13 KB · Chrome Manifest V3</p>

        <div className="mt-10 space-y-4">
          {/* Step 1 */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">
                01
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600" />
                  Unduh Paket Ekstensi
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Klik tombol unduh di atas dan simpan file{" "}
                  <code className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-700">fokus-kerja-v1.1.0.zip</code> di komputer.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">
                02
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  Ekstrak File ZIP
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Klik kanan file ZIP, pilih <strong>Extract All</strong>, lalu simpan folder hasil ekstrak di lokasi yang tidak akan dipindahkan atau dihapus.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">
                03
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Puzzle className="h-4 w-4 text-blue-600" />
                  Muat Ekstensi di Chrome
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Buka <code className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-700">chrome://extensions</code>, aktifkan <strong>Developer mode</strong>, klik <strong>Load unpacked</strong>, lalu pilih folder hasil ekstrak yang berisi <code className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-700">manifest.json</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">
                04
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  Masuk & Sinkronkan Sesi
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Masuk ke Dashboard
                  </Link>
                  . Ekstensi akan mendeteksi login dan menyinkronkan sesi secara otomatis. Tambahkan aturan kuota domain di halaman Aturan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm text-blue-900">
          <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Catatan:</strong> Chrome dapat menonaktifkan ekstensi yang dimuat manual setelah foldernya dipindah atau dihapus. Simpan folder hasil ekstrak, dan gunakan halaman ini untuk mengunduh versi terbaru.
          </p>
        </div>
      </main>
    </div>
  );
}

