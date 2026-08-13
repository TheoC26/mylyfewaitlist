"use client";

import { num, pct } from "./format";

/**
 * A ranked list with a magnitude bar — clip categories.
 *
 * Sorted descending, every row directly labelled, single hue. Rank is carried by
 * position and length; colour carries nothing, which is correct for a magnitude
 * comparison and means a filter that reorders the list never repaints it.
 */
export default function RankedBars({ rows, labelKey, valueKey, pctKey, empty }) {
  if (!rows.length) {
    return <p className="py-8 text-sm text-gray-400">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r[valueKey] ?? 0));

  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li key={row[labelKey]}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {/* Category values are snake_case in the DB (study_work). */}
            <span className="truncate capitalize text-gray-600">
              {String(row[labelKey]).replace(/_/g, " ")}
            </span>
            <span className="shrink-0 tabular-nums text-gray-400">
              <span className="font-semibold text-black">
                {num(row[valueKey])}
              </span>
              {pctKey && <> · {pct(row[pctKey], 1)}</>}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-gray-100">
            <div
              className="h-1.5 bg-black"
              style={{
                width: `${max ? ((row[valueKey] ?? 0) / max) * 100 : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
