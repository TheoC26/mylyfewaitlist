"use client";

/**
 * Re-deals the collage — a new set of faces without a page load.
 *
 * Written in the same quiet vocabulary as the Countdown it sits opposite:
 * hairline, uppercase, wide tracking, grey until you touch it. No shadow, no
 * fill. It has to sit on top of moving footage, so it carries just enough
 * white to stay legible and nothing more.
 *
 * The tighter mobile metrics are not cosmetic: the countdown label is centred
 * across the same strip, and at 320px the roomier desktop padding leaves a 2px
 * gap between the two.
 *
 * @param {{ turns: number, onReload: () => void }} props
 *   `turns` is the number of times the wall has been re-dealt. The icon rotates
 *   a full turn per click purely as feedback — the swap itself is instant, so
 *   without it there is nothing to confirm the press landed.
 */
export default function ReloadWall({ turns = 0, onReload }) {
  return (
    <button
      type="button"
      onClick={onReload}
      aria-label="Show a different set of videos"
      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/70 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-400 backdrop-blur-sm transition-colors hover:border-gray-300 hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 sm:gap-1.5 sm:px-3 sm:text-[11px] sm:tracking-[0.2em]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `rotate(${turns * 360}deg)` }}
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1.06 6.66 2.88L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
      Reload
    </button>
  );
}
