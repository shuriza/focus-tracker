import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, SlidersHorizontal, BarChart2, Laptop, User } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h1 className="text-xl font-bold">
            Supabase belum dikonfigurasi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            Salin file <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-bold">.env.example</code> menjadi{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-bold">.env.local</code> lalu isi URL
            proyek dan anon key.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Fokus<span className="text-blue-600">Kerja</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              <User className="h-3 w-3 text-slate-400" />
              <span className="max-w-[160px] truncate">{user.email}</span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
            >
              <BarChart2 className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Minggu Ini</span>
            </Link>
            <Link
              href="/dashboard/aturan"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Aturan</span>
            </Link>
            <Link
              href="/panduan"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
            >
              <Laptop className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Ekstensi</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <SignOutButton />
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}

