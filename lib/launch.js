/**
 * When MyLyfe launches, and everything that hangs off that moment.
 *
 * Plain module, no React — imported by both the server component that renders
 * the homepage and the client hook that ticks the countdown, so it must work in
 * either environment.
 */

/**
 * 6:00 AM ET on August 11, 2026 — ONE global instant, not "6am wherever you
 * happen to be".
 *
 * The explicit -04:00 offset is the whole point. A bare "2026-08-11T06:00:00"
 * is parsed as LOCAL time, so the flip would fire at a different real moment
 * for every visitor: Sydney would see the download page most of a day before
 * the App Store listing went live in New York. Pinning the offset makes the
 * launch a single event that can be coordinated with a post, a push, and the
 * App Store release.
 *
 * -04:00 is EDT, which is what New York is actually on in August. "6am EST"
 * would be 7am in New York on this date — not what was intended. Do not "fix"
 * this to -05:00.
 */
export const LAUNCH_AT_ISO =
  process.env.NEXT_PUBLIC_LAUNCH_AT || "2026-08-11T06:00:00-04:00";

export const LAUNCH_AT_MS = Date.parse(LAUNCH_AT_ISO);

export const APP_STORE_URL = "https://apps.apple.com/app/id6758522939";

/** Human-readable, for the accessible label and any copy that needs it. */
export const LAUNCH_LABEL = "August 11, 2026";

/** @param {number} [nowMs] */
export function hasLaunched(nowMs = Date.now()) {
  return Number.isFinite(LAUNCH_AT_MS) && nowMs >= LAUNCH_AT_MS;
}

/**
 * Time left, clamped at zero so the countdown never renders negative numbers
 * in the seconds between the launch instant and the next tick.
 *
 * @param {number} [nowMs]
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, total: number }}
 */
export function remainingParts(nowMs = Date.now()) {
  const total = Math.max(0, LAUNCH_AT_MS - nowMs);
  const seconds = Math.floor(total / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    total,
  };
}
