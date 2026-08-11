"use client";

import { LAUNCH_DATE_CONFIRMED, LAUNCH_LABEL } from "@/lib/launch";

/**
 * The launch countdown. Deliberately quiet — four numbers in a row, no boxes,
 * no borders, no shadow. It sits under the subcopy and is the only thing on the
 * page that moves on its own, which is enough to draw the eye without competing
 * with the signup form.
 *
 * While LAUNCH_DATE_CONFIRMED is false this renders "launching soon / date to
 * be announced" instead — same footprint, same two-line shape, so the layout
 * around it (the Reload button pinned opposite it) does not have to know which
 * state it's in. See lib/launch.js for why: the auto-flip date underneath is a
 * placeholder, and ticking digits down to a placeholder would state a launch
 * date publicly that nobody has actually committed to.
 *
 * @param {{ parts: {days:number,hours:number,minutes:number,seconds:number}|null,
 *           className?: string }} props
 *   `parts` is null until the client has mounted; see useLaunchState for why
 *   that matters. Placeholders render in the meantime.
 */
export default function Countdown({ parts, className = "" }) {
  if (!LAUNCH_DATE_CONFIRMED) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <span
          aria-hidden="true"
          className="text-[10px] uppercase tracking-[0.2em] text-gray-400 sm:text-[11px]"
        >
          Launching soon
        </span>
        <span className="mt-2.5 text-sm text-gray-400 sm:text-base">
          Date to be announced
        </span>
      </div>
    );
  }

  const units = [
    { label: "days", value: parts?.days },
    { label: "hrs", value: parts?.hours },
    { label: "min", value: parts?.minutes },
    { label: "sec", value: parts?.seconds },
  ];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* A screen reader announcing four digits every second is unusable, so
          the live region is off and this static line carries the meaning. */}
      <span className="sr-only">Launching {LAUNCH_LABEL}</span>

      <span
        aria-hidden="true"
        className="text-[10px] uppercase tracking-[0.2em] text-gray-400 sm:text-[11px]"
      >
        Launching in
      </span>

      <div className="mt-2.5 flex items-start gap-5 sm:gap-7">
        {units.map(({ label, value }) => (
          <div key={label} aria-hidden="true" className="flex flex-col">
            {/* tabular-nums + a fixed min width so the row does not jitter as
                digits change, or shift when placeholders resolve to real values. */}
            <span className="text-lg font-medium tabular-nums tracking-tight text-center text-black sm:text-xl">
              {value === undefined
                ? "--"
                : String(value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-center text-[9px] uppercase tracking-[0.15em] text-gray-400 sm:text-[10px]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
