"use server";

import { revalidatePath } from "next/cache";
import { parseBudgetMinutes } from "@/lib/budget";
import { createClient } from "@/lib/supabase/server";

export type BudgetActionState = {
  error: string | null;
  saved: boolean;
};

export async function saveFocusBudget(
  _prev: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const { minutes, error: validationError } = parseBudgetMinutes(
    String(formData.get("daily_budget_minutes") ?? ""),
  );
  if (validationError) {
    return { error: validationError, saved: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Masuk lagi.", saved: false };
  }

  const { error } =
    minutes === null
      ? await supabase.from("focus_settings").delete().eq("user_id", user.id)
      : await supabase.from("focus_settings").upsert(
          {
            user_id: user.id,
            daily_budget_minutes: minutes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

  if (error) {
    return { error: error.message, saved: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/aturan");
  return { error: null, saved: true };
}
