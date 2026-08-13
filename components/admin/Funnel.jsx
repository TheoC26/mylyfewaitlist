"use client";

import { num, pct } from "./format";

/**
 * Horizontal funnel bars. Plain divs with a width percentage — a bar chart of six
 * values does not need a rendering engine, and this keeps the row label, count and
 * both percentages on one baseline where they can be read together.
 *
 * Every bar is directly labelled, so length is never the only encoding.
 */
export default function Funnel({ steps }) {
  const top = steps[0]?.count ?? 0;
  if (!top) {
    return <p className="py-8 text-sm text-gray-400">No users in this cohort yet.</p>;
  }

  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => (
        <li key={step.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-gray-600">{step.label}</span>
            {/* Share of ALL users, not of the previous step. The steps are "ever
                did this" and genuinely not sequential — more people have added a
                friend than have taken a clip — so a step-over-step percentage
                renders as "140% of previous" and reads like a bug. */}
            <span className="shrink-0 tabular-nums text-gray-400">
              <span className="font-semibold text-black">{num(step.count)}</span>
              {index > 0 && <> · {pct(step.pctOfTop, 0)} of all users</>}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-gray-100">
            <div
              className="h-1.5 bg-black"
              style={{ width: `${Math.max(0, (step.pctOfTop ?? 0) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
