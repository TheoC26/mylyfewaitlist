"use client";

import { num } from "./format";

/**
 * When clips get captured — 7 days x 24 hours, in the clipper's own local time.
 *
 * A CSS grid rather than a chart mark: 168 squares of flat colour are sharper at
 * 12px than anything a renderer will draw, and it keeps a pre-alpha library off
 * the most eye-catching visual on the page.
 *
 * Sequential encoding, one hue, light to dark — magnitude, so no categorical
 * colour. The ramp is sqrt rather than linear because clip volume is heavily
 * peaked: on a linear ramp every hour outside the evening reads as identically
 * empty, which hides the pattern the chart exists to show.
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_TICKS = [
  [0, "12a"],
  [6, "6a"],
  [12, "12p"],
  [18, "6p"],
  [23, "11p"],
];

function label(day, hour, count) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "am" : "pm";
  return `${day} ${h12}${suffix} — ${num(count)} clip${count === 1 ? "" : "s"}`;
}

export default function Heatmap({ counts, max }) {
  if (!max) {
    return (
      <p className="py-8 text-sm text-gray-400">
        No clips captured yet in this window.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {DAYS.map((day, row) => (
          <div key={day} className="mb-[3px] flex items-center gap-[3px]">
            <span className="w-8 shrink-0 text-right text-[10px] text-gray-400">
              {day}
            </span>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = counts[row * 24 + hour] ?? 0;
              const intensity = Math.sqrt(count / max);
              return (
                <div
                  key={hour}
                  title={label(day, hour, count)}
                  className="h-3 w-3 shrink-0"
                  style={{
                    backgroundColor:
                      count === 0
                        ? "#f9fafb"
                        : `rgba(17,17,17,${(0.1 + intensity * 0.9).toFixed(3)})`,
                  }}
                />
              );
            })}
          </div>
        ))}
        {/* Spread the five labels across the exact width of the 24 cells
            (24 x 12px + 23 x 3px gap). Giving each hour its own 12px box instead
            clips any label wider than the cell, which loses "11p". */}
        <div
          className="ml-8 flex justify-between text-[10px] text-gray-400"
          style={{ width: 24 * 12 + 23 * 3 }}
          aria-hidden="true"
        >
          {HOUR_TICKS.map(([hour, text]) => (
            <span key={hour}>{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
