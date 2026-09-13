import {
  AlertTriangle,
  Info,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Insight, InsightTone } from "@/lib/insights";

const INSIGHT_TONES: Record<
  InsightTone,
  { root: string; icon: string; Icon: LucideIcon }
> = {
  emerald: {
    root: "border-emerald-200 bg-emerald-50/70",
    icon: "text-emerald-600",
    Icon: ShieldCheck,
  },
  amber: {
    root: "border-amber-200 bg-amber-50/75",
    icon: "text-amber-600",
    Icon: TrendingUp,
  },
  rose: {
    root: "border-rose-200 bg-rose-50/75",
    icon: "text-rose-600",
    Icon: AlertTriangle,
  },
  blue: {
    root: "border-blue-200 bg-blue-50/70",
    icon: "text-blue-600",
    Icon: Lightbulb,
  },
};

export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center text-sm text-slate-500">
        <Info className="h-5 w-5 text-blue-500 mb-1.5" />
        <p className="font-semibold text-slate-700">Belum ada insight untuk rentang ini.</p>
        <p className="mt-1 text-xs">Tambahkan kuota domain atau tunggu sinkronisasi berikutnya.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => {
        const tone = INSIGHT_TONES[insight.tone];
        const Icon = tone.Icon;
        return (
          <li key={insight.id} className={`rounded-xl border p-4 ${tone.root}`}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} />
              <div>
                <p className="text-sm font-bold text-slate-900">{insight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{insight.detail}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
