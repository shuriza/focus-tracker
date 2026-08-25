import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Download, Laptop, ShieldCheck, Sparkles } from "lucide-react";

const EXTENSION_DOWNLOAD = "/downloads/fokus-kerja-v1.1.0.zip";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute top-1/2 left-0 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <main className="mx-auto min-h-screen max-w-6xl px-6 py-8 md:py-12">
        {/* Navigation */}
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3.5 shadow-sm backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-base tracking-tight font-extrabold text-slate-900">
              Fokus<span className="text-blue-600">Kerja</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/panduan"
              className="hidden sm:inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-blue-600"
            >
              <Laptop className="h-4 w-4 text-slate-400" />
              Pasang Ekstensi
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Masuk
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="mt-12 md:mt-20 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
              </span>
              Pencatat waktu · Pemblokir distraksi cerdas
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.15]">
              Kendalikan kuota harian untuk situs yang{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                menyita fokusmu.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Ekstensi otomatis mencatat durasi di tab aktif YouTube, X, atau portal media.
              Begitu kuota habis, layar diproteksi dengan pengingat ramah — bukan gamifikasi rumit.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                Mulai Atur Kuota
              </Link>
              <Link
                href={EXTENSION_DOWNLOAD}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                Unduh Ekstensi v1.1.0
              </Link>
            </div>

            <Link
              href="/panduan"
              className="mt-3 inline-flex text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-600"
            >
              Lihat panduan instalasi Chrome
            </Link>

            <div className="mt-8 flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                100% data pribadi di tanganmu
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div>Sinkron instan dengan Supabase</div>
            </div>
          </div>

          {/* Interactive Preview Card */}
          <aside className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-blue-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <p className="text-xs font-bold tracking-wide uppercase text-slate-500">
                  Aktivitas Hari Ini (Live)
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Simulasi
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Item 1 - YouTube */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    youtube.com
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    32 / 30 mnt · Diblokir
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-rose-200/60">
                  <div className="h-full w-full rounded-full bg-rose-500" />
                </div>
              </div>

              {/* Item 2 - X / Twitter */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    x.com
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    14 / 20 mnt (sisa 6 mnt)
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[70%] rounded-full bg-blue-600" />
                </div>
              </div>

              {/* Item 3 - GitHub */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    github.com
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Produktif · Bebas
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[45%] rounded-full bg-teal-600" />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-blue-50/60 p-3.5 border border-blue-100">
              <p className="text-xs leading-relaxed text-blue-900/80">
                <span className="font-semibold text-blue-900">Tips:</span> Ekstensi otomatis menyelaraskan waktu browser secara presisi hanya pada tab yang sedang aktif dipandang.
              </p>
            </div>
          </aside>
        </section>

        {/* Features Section */}
        <section className="mt-20 md:mt-28">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dibuat untuk produktivitas nyata
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Fitur esensial yang tidak mengganggu alur kerjamu.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Timer di Tab Aktif",
                body: "Service worker pintar menghitung detik hanya saat tab terlihat dan aktif. Begitu kamu berganti tab, timer otomatis berpindah.",
              },
              {
                icon: ShieldCheck,
                title: "Proteksi Kuota Fleksibel",
                body: "Tentukan batas waktu spesifik per situs. Saat habis, layar digantikan pengingat fokus yang elegan tanpa scroll tanpa henti.",
              },
              {
                icon: BarChart3,
                title: "Analisis Tren 7 Hari",
                body: "Pantau kebiasaan mingguan dengan grafik jernih. Ketahui domain yang paling banyak memakan waktu dan perbaiki ritmemu.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200/80 pt-8 pb-12 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Fokus Kerja · Dibangun untuk fokus dan produktivitas harian.</p>
          <Link href="/privacy" className="mt-2 inline-block font-medium text-slate-400 underline-offset-2 hover:text-blue-600 hover:underline">
            Kebijakan Privasi
          </Link>
        </footer>
      </main>
    </div>
  );
}

