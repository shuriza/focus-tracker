import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { generateFocusReview } from "@/lib/claude/focus-review";
import { hasClaudeConfig, hasSupabaseConfig } from "@/lib/env";
import {
  buildFocusReviewSnapshot,
  type FocusReview,
  type FocusReviewAction,
  type FocusReviewPattern,
} from "@/lib/focus-review";
import { parseRangeDays, type RangeDays } from "@/lib/range";
import { createClient } from "@/lib/supabase/server";
import { lastNDates } from "@/lib/time";
import type { DailyAnalytic, FocusSettings, Rule } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  rangeDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  consent: z.literal(true),
});

export async function GET(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return apiError("Supabase belum dikonfigurasi.", 503, "SUPABASE_NOT_CONFIGURED");
  }

  const rangeDays = parseRangeDays(
    request.nextUrl.searchParams.get("rangeDays") ?? undefined,
  );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("Sesi berakhir. Masuk lagi.", 401, "UNAUTHORIZED");
  }

  const reviewResult = await supabase
    .from("focus_reviews")
    .select(
      "id, range_days, period_start, period_end, summary, patterns, model, created_at",
    )
    .eq("user_id", user.id)
    .eq("range_days", rangeDays)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reviewResult.error) {
    if (isReviewSchemaError(reviewResult.error.code)) {
      return migrationRequired();
    }
    return apiError("Review terakhir tidak dapat dimuat.", 500, "REVIEW_READ_FAILED");
  }

  if (!reviewResult.data) {
    return NextResponse.json({ review: null });
  }

  const actionsResult = await supabase
    .from("focus_review_actions")
    .select(
      "id, action_type, domain, proposed_minutes, rationale, status, decided_at",
    )
    .eq("review_id", reviewResult.data.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (actionsResult.error) {
    if (isReviewSchemaError(actionsResult.error.code)) {
      return migrationRequired();
    }
    return apiError("Usulan review tidak dapat dimuat.", 500, "ACTION_READ_FAILED");
  }

  return NextResponse.json({
    review: toFocusReview(reviewResult.data, actionsResult.data ?? []),
  });
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return apiError("Supabase belum dikonfigurasi.", 503, "SUPABASE_NOT_CONFIGURED");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("Sesi berakhir. Masuk lagi.", 401, "UNAUTHORIZED");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Permintaan review tidak valid.", 400, "INVALID_REQUEST");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Pilih rentang yang tersedia dan setujui pengiriman ringkasan.",
      400,
      "CONSENT_REQUIRED",
    );
  }
  if (!hasClaudeConfig()) {
    return apiError(
      "Claude Focus Review belum dikonfigurasi di server.",
      503,
      "CLAUDE_NOT_CONFIGURED",
    );
  }

  const { rangeDays } = parsed.data;
  const since = lastNDates(rangeDays * 2)[0];
  const [rulesResult, analyticsResult, settingsResult] = await Promise.all([
    supabase.from("rules").select("*").order("domain"),
    supabase
      .from("daily_analytics")
      .select("*")
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase.from("focus_settings").select("*").maybeSingle(),
  ]);
  const dataError =
    rulesResult.error ?? analyticsResult.error ?? settingsResult.error;
  if (dataError) {
    return apiError(
      "Data aktivitas tidak dapat disiapkan untuk review.",
      500,
      "ACTIVITY_READ_FAILED",
    );
  }

  const rules = (rulesResult.data ?? []) as Rule[];
  const rows = (analyticsResult.data ?? []) as DailyAnalytic[];
  const focusSettings = (settingsResult.data ?? null) as FocusSettings | null;
  const snapshot = buildFocusReviewSnapshot({
    rows,
    rules,
    focusSettings,
    rangeDays,
  });

  if (snapshot.current.totalMinutes === 0) {
    return apiError(
      "Belum ada aktivitas pada rentang ini. Sinkronkan ekstensi terlebih dahulu.",
      422,
      "NO_ACTIVITY",
    );
  }

  let generated;
  try {
    generated = await generateFocusReview(snapshot);
  } catch (error) {
    return claudeError(error);
  }

  const consentedAt = new Date().toISOString();
  const reviewResult = await supabase
    .from("focus_reviews")
    .insert({
      user_id: user.id,
      range_days: rangeDays,
      period_start: snapshot.period.start,
      period_end: snapshot.period.end,
      model: generated.model,
      summary: generated.summary,
      patterns: generated.patterns,
      input_snapshot: snapshot,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
      consented_at: consentedAt,
    })
    .select(
      "id, range_days, period_start, period_end, summary, patterns, model, created_at",
    )
    .single();

  if (reviewResult.error) {
    if (isReviewSchemaError(reviewResult.error.code)) {
      return migrationRequired();
    }
    return apiError("Review tidak dapat disimpan.", 500, "REVIEW_WRITE_FAILED");
  }

  let actions: unknown[] = [];
  if (generated.actions.length > 0) {
    const actionRows = generated.actions.map((action) => ({
      review_id: reviewResult.data.id,
      user_id: user.id,
      action_type: action.type,
      domain: action.domain,
      proposed_minutes: action.minutes,
      category:
        action.type === "set_domain_limit"
          ? snapshot.topDomains.find((item) => item.domain === action.domain)
              ?.category ?? "lainnya"
          : null,
      rationale: action.rationale,
    }));
    const actionsResult = await supabase
      .from("focus_review_actions")
      .insert(actionRows)
      .select(
        "id, action_type, domain, proposed_minutes, rationale, status, decided_at",
      );

    if (actionsResult.error) {
      await supabase
        .from("focus_reviews")
        .delete()
        .eq("id", reviewResult.data.id)
        .eq("user_id", user.id);
      if (isReviewSchemaError(actionsResult.error.code)) {
        return migrationRequired();
      }
      return apiError(
        "Usulan review tidak dapat disimpan.",
        500,
        "ACTION_WRITE_FAILED",
      );
    }
    actions = actionsResult.data ?? [];
  }

  return NextResponse.json(
    { review: toFocusReview(reviewResult.data, actions) },
    { status: 201 },
  );
}

function toFocusReview(
  review: Record<string, unknown>,
  actionRows: unknown[],
): FocusReview {
  const patterns = Array.isArray(review.patterns)
    ? review.patterns.filter(isFocusReviewPattern).slice(0, 4)
    : [];
  const actions = actionRows
    .map(toFocusReviewAction)
    .filter((action): action is FocusReviewAction => action !== null);

  return {
    id: String(review.id),
    rangeDays: Number(review.range_days) as RangeDays,
    periodStart: String(review.period_start),
    periodEnd: String(review.period_end),
    summary: String(review.summary),
    patterns,
    actions,
    model: String(review.model),
    createdAt: String(review.created_at),
  };
}

function isFocusReviewPattern(value: unknown): value is FocusReviewPattern {
  if (!value || typeof value !== "object") return false;
  const pattern = value as Record<string, unknown>;
  return (
    typeof pattern.title === "string" &&
    typeof pattern.detail === "string" &&
    Array.isArray(pattern.evidence) &&
    pattern.evidence.every((item) => typeof item === "string")
  );
}

function toFocusReviewAction(value: unknown): FocusReviewAction | null {
  if (!value || typeof value !== "object") return null;
  const action = value as Record<string, unknown>;
  const type = action.action_type;
  const status = action.status;
  if (
    (type !== "set_domain_limit" && type !== "set_daily_budget") ||
    (status !== "pending" && status !== "applied" && status !== "dismissed") ||
    !Number.isFinite(Number(action.proposed_minutes))
  ) {
    return null;
  }

  return {
    id: String(action.id),
    type,
    domain: typeof action.domain === "string" ? action.domain : null,
    minutes: Number(action.proposed_minutes),
    rationale: String(action.rationale),
    status,
    decidedAt:
      typeof action.decided_at === "string" ? action.decided_at : null,
  };
}

function isReviewSchemaError(code: string | undefined): boolean {
  return code === "42P01" || code === "PGRST205" || code === "PGRST202";
}

function migrationRequired() {
  return apiError(
    "Migrasi database Claude Focus Review belum diterapkan.",
    503,
    "MIGRATION_REQUIRED",
  );
}

function claudeError(error: unknown) {
  const status = readErrorStatus(error);
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error("[focus-review] Claude request failed", { name, status });

  if (status === 401 || status === 403) {
    return apiError(
      "Kredensial Claude di server tidak dapat digunakan.",
      503,
      "CLAUDE_AUTH_FAILED",
    );
  }
  if (status === 429) {
    return apiError(
      "Batas penggunaan Claude sedang tercapai. Coba lagi nanti.",
      429,
      "CLAUDE_RATE_LIMITED",
    );
  }
  if (name === "APIConnectionTimeoutError") {
    return apiError(
      "Claude belum merespons dalam batas waktu.",
      504,
      "CLAUDE_TIMEOUT",
    );
  }
  return apiError(
    "Claude Focus Review sedang tidak tersedia.",
    502,
    "CLAUDE_UNAVAILABLE",
  );
}

function readErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return null;
  }
  const rawStatus = error.status;
  if (typeof rawStatus === "number") return rawStatus;
  if (typeof rawStatus === "string") {
    const parsed = Number(rawStatus);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function apiError(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}
