import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import type { FocusReviewAction } from "@/lib/focus-review";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const decisionSchema = z.object({
  decision: z.enum(["apply", "dismiss"]),
});

const actionRowSchema = z.object({
  id: z.string().uuid(),
  action_type: z.enum(["set_domain_limit", "set_daily_budget"]),
  domain: z.string().nullable(),
  proposed_minutes: z.number().int(),
  rationale: z.string(),
  status: z.enum(["pending", "applied", "dismissed"]),
  decided_at: z.string().nullable(),
});

type ActionParams = { params: Promise<{ actionId: string }> };

export async function POST(request: NextRequest, context: ActionParams) {
  if (!hasSupabaseConfig()) {
    return apiError("Supabase belum dikonfigurasi.", 503, "SUPABASE_NOT_CONFIGURED");
  }

  const { actionId } = await context.params;
  if (!z.string().uuid().safeParse(actionId).success) {
    return apiError("Usulan tidak valid.", 400, "INVALID_ACTION");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Keputusan tidak valid.", 400, "INVALID_REQUEST");
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Keputusan tidak valid.", 400, "INVALID_DECISION");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("Sesi berakhir. Masuk lagi.", 401, "UNAUTHORIZED");
  }

  if (parsed.data.decision === "dismiss") {
    const result = await supabase
      .from("focus_review_actions")
      .update({ status: "dismissed", decided_at: new Date().toISOString() })
      .eq("id", actionId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select(
        "id, action_type, domain, proposed_minutes, rationale, status, decided_at",
      )
      .maybeSingle();

    if (result.error) {
      return apiError("Usulan tidak dapat diabaikan.", 500, "ACTION_UPDATE_FAILED");
    }
    if (!result.data) {
      return apiError(
        "Usulan sudah diproses atau tidak ditemukan.",
        409,
        "ACTION_NOT_PENDING",
      );
    }

    const action = parseAction(result.data);
    if (!action) {
      return apiError("Respons usulan tidak valid.", 500, "ACTION_RESPONSE_INVALID");
    }
    revalidatePath("/dashboard");
    return NextResponse.json({ action });
  }

  const result = await supabase.rpc("apply_focus_review_action", {
    p_action_id: actionId,
  });
  if (result.error) {
    if (result.error.code === "PGRST202") {
      return apiError(
        "Migrasi database Claude Focus Review belum diterapkan.",
        503,
        "MIGRATION_REQUIRED",
      );
    }
    if (result.error.code === "P0001") {
      return apiError(
        "Usulan sudah diproses atau tidak ditemukan.",
        409,
        "ACTION_NOT_PENDING",
      );
    }
    return apiError("Usulan tidak dapat diterapkan.", 500, "ACTION_APPLY_FAILED");
  }

  const rawAction = Array.isArray(result.data) ? result.data[0] : result.data;
  const action = parseAction(rawAction);
  if (!action) {
    return apiError("Respons usulan tidak valid.", 500, "ACTION_RESPONSE_INVALID");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/aturan");
  return NextResponse.json({ action });
}

function parseAction(value: unknown): FocusReviewAction | null {
  const parsed = actionRowSchema.safeParse(value);
  if (!parsed.success) return null;
  const row = parsed.data;
  return {
    id: row.id,
    type: row.action_type,
    domain: row.domain,
    minutes: row.proposed_minutes,
    rationale: row.rationale,
    status: row.status,
    decidedAt: row.decided_at,
  };
}

function apiError(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}
