"use server";

import { revalidatePath } from "next/cache";
import { isCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/time";

export type RuleActionState = {
  error: string | null;
};

export async function createRule(
  _prev: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  const minutes = Number(formData.get("time_limit_minutes"));
  const rawCategory = String(formData.get("category") ?? "lainnya");
  const rawStart = String(formData.get("active_start_hour") ?? "");
  const rawEnd = String(formData.get("active_end_hour") ?? "");

  if (!domain) {
    return { error: "Masukkan domain yang valid, misalnya youtube.com." };
  }
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60) {
    return { error: "Batas waktu harus antara 1 dan 1440 menit." };
  }

  const category = isCategory(rawCategory) ? rawCategory : "lainnya";
  const active_start_hour = parseHour(rawStart);
  const active_end_hour = parseHour(rawEnd);

  if ((active_start_hour === null) !== (active_end_hour === null)) {
    return { error: "Isi jam mulai dan jam selesai keduanya, atau kosongkan keduanya." };
  }
  if (
    active_start_hour !== null &&
    active_end_hour !== null &&
    active_start_hour === active_end_hour
  ) {
    return { error: "Jam mulai dan jam selesai tidak boleh sama." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Masuk lagi." };
  }

  const { error } = await supabase.from("rules").upsert(
    {
      user_id: user.id,
      domain,
      time_limit_minutes: Math.round(minutes),
      category,
      active_start_hour,
      active_end_hour,
    },
    { onConflict: "user_id,domain" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/aturan");
  return { error: null };
}

export async function deleteRule(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("rules").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/aturan");
}

function parseHour(raw: string): number | null {
  if (raw === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 23) return null;
  return value;
}