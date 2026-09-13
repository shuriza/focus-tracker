import Link from "next/link";
import { RANGE_OPTIONS, rangeLabel, type RangeDays } from "@/lib/range";

export function RangeTabs({
  active,
  basePath,
}: {
  active: RangeDays;
  basePath: string;
}) {
  return (
    <nav aria-label="Rentang waktu">
      <ul className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50/70 p-1 shadow-2xs">
        {RANGE_OPTIONS.map((days) => {
          const isActive = days === active;
          return (
            <li key={days}>
              <Link
                href={`${basePath}?rentang=${days}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                {rangeLabel(days)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
