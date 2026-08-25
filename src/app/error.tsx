"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50 mb-4">
        <AlertOctagon className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Terjadi Kesalahan
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 active:scale-95 cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        Coba Lagi
      </button>
    </main>
  );
}

