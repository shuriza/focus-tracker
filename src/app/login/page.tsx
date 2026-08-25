import Link from "next/link";
import { Clock, ArrowLeft, ShieldAlert } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
            <p className="text-xs text-slate-500 font-medium">Autentikasi Pengguna</p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Masuk ke dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Atur batasan kuota domain dan pantau kebiasaan fokusmu secara real-time.
        </p>

        {params.error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <p>Gagal menukar kode masuk. Coba lagi dari formulir di bawah.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-blue-900/5">
          <AuthForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}

