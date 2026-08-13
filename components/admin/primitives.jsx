"use client";

import { delta as fmtDelta } from "./format";

/**
 * Layout pieces for the Overview tab.
 *
 * House style: no cards, no shadows, no rounded containers. Structure comes from
 * whitespace and 1px hairlines only. The stat grid gets its hairlines from
 * `gap-px` over a gray background — the 1px gap between white cells *is* the rule,
 * which avoids both a border on every cell and the double-line seams you get from
 * bordering neighbours.
 */

export function Section({ title, note, children, className = "" }) {
  return (
    <section className={`border-t border-gray-200 pt-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {title}
        </h2>
        {note && <p className="text-xs text-gray-400">{note}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatGrid({ children, cols = 4 }) {
  const lg = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[cols];
  return (
    <div className={`grid grid-cols-2 gap-px bg-gray-200 ${lg}`}>{children}</div>
  );
}

export function Stat({ label, value, sub, delta, big = false }) {
  return (
    <div className="bg-white py-4 pr-4 lg:pl-4 lg:first:pl-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1.5 font-semibold tabular-nums tracking-tight ${
          big ? "text-4xl" : "text-2xl"
        } ${value === "—" ? "text-gray-300" : "text-black"}`}
      >
        {value}
      </p>
      {delta !== undefined && delta !== null && (
        <p className="mt-1 text-xs tabular-nums text-gray-500">
          {fmtDelta(delta)} <span className="text-gray-400">vs window start</span>
        </p>
      )}
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/** Marks a number that is inferred rather than measured. */
export function Approx() {
  return (
    <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-gray-400">
      approx
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-50 ${className}`} />;
}

/**
 * What a panel shows when the answer is "not yet".
 *
 * The app launched on 2026-08-11, so weekly, cohort and montage panels are
 * legitimately empty for the first week. A quiet sentence explains that; an empty
 * pair of axes just looks broken.
 */
export function NotYet({ children }) {
  return (
    <p className="py-8 text-sm text-gray-400">{children}</p>
  );
}

export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex divide-x divide-gray-300 overflow-hidden rounded-md border border-gray-300"
    >
      {options.map((option) => {
        const key = option.value ?? option;
        const label = option.label ?? option;
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-black text-white"
                : "bg-white text-gray-500 hover:text-black"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
