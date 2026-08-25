import { NextResponse } from "next/server";
import { categoryLabel } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { lastNDates } from "@/lib/time";
import type { DailyAnalytic, Rule } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = lastNDates(30)[0];
  const [rulesResult, analyticsResult] = await Promise.all([
    supabase.from("rules").select("*"),
    supabase
      .from("daily_analytics")
      .select("*")
      .gte("date", since)
      .order("date", { ascending: false })
      .order("domain", { ascending: true }),
  ]);

  if (rulesResult.error || analyticsResult.error) {
    return NextResponse.json(
      { error: rulesResult.error?.message ?? analyticsResult.error?.message },
      { status: 500 },
    );
  }

  const rules = (rulesResult.data ?? []) as Rule[];
  const rows = (analyticsResult.data ?? []) as DailyAnalytic[];

  const header = ["date", "domain", "seconds", "minutes", "category", "limit_minutes"];
  const lines = rows.map((row) => {
    const rule = rules.find((r) => r.domain === row.domain) ?? null;
    const minutes = Math.round(row.time_spent_seconds / 60);
    return [
      row.date,
      row.domain,
      String(row.time_spent_seconds),
      String(minutes),
      categoryLabel(rule?.category),
      rule ? String(rule.time_limit_minutes) : "",
    ].map(csvCell).join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  const filename = `fokus-kerja-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}