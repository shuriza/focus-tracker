"use client";

import {
  AlertCircle,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FocusReview,
  FocusReviewAction,
  FocusReviewActionStatus,
} from "@/lib/focus-review";
import type { RangeDays } from "@/lib/range";

type FocusReviewPanelProps = {
  rangeDays: RangeDays;
};

type ReviewResponse = { review: FocusReview | null };
type ActionResponse = { action: FocusReviewAction };

type ReviewError = {
  code: string;
  message: string;
};

export function FocusReviewPanel({ rangeDays }: FocusReviewPanelProps) {
  const router = useRouter();
  const [review, setReview] = useState<FocusReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<ReviewError | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/focus-review?rangeDays=${rangeDays}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await readJson(response);
        if (!response.ok) {
          throw createReviewError(payload);
        }
        if (!isReviewResponse(payload)) {
          throw new Error("Respons review tidak valid.");
        }
        return payload;
      })
      .then((payload) => {
        if (!cancelled) setReview(payload.review);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(toReviewError(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  async function generateReview() {
    if (!consent) return;
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/focus-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rangeDays, consent: true }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw createReviewError(payload);
      if (!isReviewResponse(payload) || !payload.review) {
        throw new Error("Review tidak tersedia.");
      }
      setReview(payload.review);
      setConsent(false);
    } catch (reason: unknown) {
      setError(toReviewError(reason));
    } finally {
      setGenerating(false);
    }
  }

  async function decideAction(action: FocusReviewAction, decision: "apply" | "dismiss") {
    setActingId(action.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/focus-review/actions/${encodeURIComponent(action.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const payload = await readJson(response);
      if (!response.ok) throw createReviewError(payload);
      if (!isActionResponse(payload)) {
        throw new Error("Respons tindakan tidak valid.");
      }
      setReview((current) =>
        current
          ? {
              ...current,
              actions: current.actions.map((item) =>
                item.id === payload.action.id ? payload.action : item,
              ),
            }
          : current,
      );
      router.refresh();
    } catch (reason: unknown) {
      setError(toReviewError(reason));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section
      aria-labelledby="focus-review-title"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
    >
      <div className="relative border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Review fokus</p>
              <h2 id="focus-review-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Baca polanya, bukan hanya angkanya
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                Claude merangkum aktivitas {rangeDays} hari dari data agregat dan mengusulkan
                perubahan yang tetap harus kamu setujui.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Data ringkasan saja
          </span>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-7">
        {error ? <ErrorNotice error={error} onRetry={() => window.location.reload()} /> : null}

        {loading ? <LoadingReview /> : null}

        {!loading && !error && !review ? (
          <EmptyReview
            consent={consent}
            generating={generating}
            onConsentChange={setConsent}
            onGenerate={generateReview}
          />
        ) : null}

        {!loading && review ? (
          <ReviewResult
            review={review}
            actingId={actingId}
            onDecision={decideAction}
          />
        ) : null}
      </div>
    </section>
  );
}

function EmptyReview({
  consent,
  generating,
  onConsentChange,
  onGenerate,
}: {
  consent: boolean;
  generating: boolean;
  onConsentChange: (value: boolean) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Review ini mengirim domain teratas, durasi, kuota, dan tren periode aktif ke Claude.
          Isi halaman, URL lengkap, dan teks yang kamu ketik tidak ikut dikirim.
        </p>
        <label className="mt-5 flex max-w-2xl items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => onConsentChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500/30"
          />
          <span>
            Saya setuju mengirim ringkasan aktivitas ini untuk satu kali review Claude.
          </span>
        </label>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={!consent || generating}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {generating ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {generating ? "Menyusun review…" : "Buat review fokus"}
      </button>
    </div>
  );
}

function ReviewResult({
  review,
  actingId,
  onDecision,
}: {
  review: FocusReview;
  actingId: string | null;
  onDecision: (action: FocusReviewAction, decision: "apply" | "dismiss") => void;
}) {
  const pendingActions = review.actions.filter((action) => action.status === "pending");

  return (
    <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{review.rangeDays} hari</span>
          <span>
            {formatDate(review.periodStart)} — {formatDate(review.periodEnd)}
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-lg font-semibold leading-relaxed text-slate-900">
          {review.summary}
        </p>

        {review.patterns.length > 0 ? (
          <div className="mt-6 space-y-4">
            {review.patterns.map((pattern) => (
              <article key={`${pattern.title}-${pattern.detail}`} className="border-l-2 border-blue-200 pl-4">
                <h3 className="text-sm font-bold text-slate-900">{pattern.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{pattern.detail}</p>
                {pattern.evidence.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {pattern.evidence.map((item) => (
                      <li key={item} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Dibuat {formatDateTime(review.createdAt)} · {review.model}
        </p>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Usulan perubahan</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Tidak ada perubahan otomatis. Pilih satu per satu.
            </p>
          </div>
          <Sparkles className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        </div>

        {review.actions.length === 0 ? (
          <p className="py-6 text-sm leading-relaxed text-slate-600">
            Belum ada usulan yang cukup kuat untuk diterapkan.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {review.actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                busy={actingId === action.id}
                onDecision={onDecision}
              />
            ))}
          </div>
        )}

        {pendingActions.length > 0 ? (
          <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
            Terapkan hanya perubahan yang sesuai dengan ritmemu. Kamu bisa mengubahnya lagi dari halaman Aturan.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function ActionRow({
  action,
  busy,
  onDecision,
}: {
  action: FocusReviewAction;
  busy: boolean;
  onDecision: (action: FocusReviewAction, decision: "apply" | "dismiss") => void;
}) {
  const isPending = action.status === "pending";
  const target = action.type === "set_daily_budget" ? "Anggaran harian" : action.domain;
  const detail = action.type === "set_daily_budget" ? "batas total browsing" : "batas domain";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{target}</p>
          <p className="mt-1 text-xs text-slate-500">
            {detail} → <span className="font-semibold text-slate-700">{action.minutes} menit</span>
          </p>
        </div>
        <StatusBadge status={action.status} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">{action.rationale}</p>
      {isPending ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDecision(action, "apply")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => onDecision(action, "dismiss")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Abaikan
          </button>
        </div>
      ) : null}
    </article>
  );
}

function StatusBadge({ status }: { status: FocusReviewActionStatus }) {
  const statusView: Record<FocusReviewActionStatus, { label: string; className: string }> = {
    pending: { label: "Menunggu", className: "bg-amber-50 text-amber-700" },
    applied: { label: "Diterapkan", className: "bg-emerald-50 text-emerald-700" },
    dismissed: { label: "Diabaikan", className: "bg-slate-100 text-slate-500" },
  };
  const view = statusView[status];
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${view.className}`}>{view.label}</span>;
}

function LoadingReview() {
  return (
    <div className="space-y-4" aria-label="Memuat review fokus" role="status">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
      <div className="h-6 max-w-xl animate-pulse rounded bg-slate-100" />
      <div className="h-4 max-w-2xl animate-pulse rounded bg-slate-100" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-50" />
    </div>
  );
}

function ErrorNotice({ error, onRetry }: { error: ReviewError; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
        <p className="leading-relaxed">{friendlyError(error)}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Coba lagi
      </button>
    </div>
  );
}

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function createReviewError(payload: unknown): ReviewError {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = payload.error;
    const code = "code" in payload ? payload.code : "UNKNOWN";
    return {
      code: typeof code === "string" ? code : "UNKNOWN",
      message: typeof error === "string" ? error : "Permintaan tidak dapat diproses.",
    };
  }
  return { code: "UNKNOWN", message: "Permintaan tidak dapat diproses." };
}

function toReviewError(reason: unknown): ReviewError {
  if (reason && typeof reason === "object" && "code" in reason && "message" in reason) {
    const code = reason.code;
    const message = reason.message;
    if (typeof code === "string" && typeof message === "string") {
      return { code, message };
    }
  }
  if (reason instanceof Error) return { code: "UNKNOWN", message: reason.message };
  return { code: "UNKNOWN", message: "Permintaan tidak dapat diproses." };
}

function friendlyError(error: ReviewError): string {
  switch (error.code) {
    case "CLAUDE_NOT_CONFIGURED":
      return "Fitur AI belum dikonfigurasi di server. Tambahkan ANTHROPIC_API_KEY sebelum deployment.";
    case "MIGRATION_REQUIRED":
      return "Migrasi database Focus Review belum diterapkan. Jalankan migrasi sebelum memakai fitur ini.";
    case "NO_ACTIVITY":
      return error.message;
    default:
      return error.message;
  }
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  if (!value || typeof value !== "object" || !("review" in value)) return false;
  const review = value.review;
  return (
    review === null ||
    (typeof review === "object" &&
      review !== null &&
      "id" in review &&
      "actions" in review &&
      Array.isArray(review.actions))
  );
}

function isActionResponse(value: unknown): value is ActionResponse {
  if (!value || typeof value !== "object" || !("action" in value)) return false;
  const action = value.action;
  return (
    typeof action === "object" &&
    action !== null &&
    "id" in action &&
    "status" in action
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
