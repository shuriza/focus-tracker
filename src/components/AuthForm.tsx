"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Mail, Lock, AlertCircle, CheckCircle2, LogIn, UserPlus } from "lucide-react";

const initial: AuthState = { error: null, message: null };

export function AuthForm({ nextPath }: { nextPath: string }) {
  const [signInState, signInAction, signingIn] = useActionState(signIn, initial);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, initial);
  const error = signInState.error ?? signUpState.error;
  const message = signUpState.message;

  return (
    <div className="space-y-6">
      <form className="space-y-4" action={signInAction}>
        <input type="hidden" name="next" value={nextPath} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="kamu@kantor.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Kata sandi
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="Minimal 8 karakter"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        ) : null}

        {message ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <p className="leading-relaxed">{message}</p>
          </div>
        ) : null}

        <div className="pt-2 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="submit"
            disabled={signingIn || signingUp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            <LogIn className="h-4 w-4" />
            {signingIn ? "Memproses..." : "Masuk"}
          </button>
          <button
            type="submit"
            formAction={signUpAction}
            disabled={signingIn || signingUp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            <UserPlus className="h-4 w-4 text-slate-500" />
            {signingUp ? "Mendaftar..." : "Daftar Akun"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-center">
        <p className="text-xs leading-relaxed text-blue-900/80">
          Akun yang sama digunakan pada Dashboard dan Ekstensi Chrome. Setelah masuk, sinkronkan sesi di popup ekstensi.
        </p>
      </div>
    </div>
  );
}

