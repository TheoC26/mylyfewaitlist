/**
 * Formatters and the dashboard's two mark colors.
 *
 * There is no categorical palette here on purpose. Every chart on the Overview
 * tab is either single-series or one entity measured two ways, so identity never
 * rests on hue: the two tones differ by lightness (normal-vision and CVD ΔE ~37),
 * and the second series additionally carries a dash pattern and a direct label.
 *
 * Both tones clear 3:1 against white. gray-400 (#9ca3af) does not (2.54:1), so it
 * stays on text and grid lines and is never used to carry data.
 */

export const INK = "#111111";
export const INK_2 = "#6b7280";

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const FULL = new Intl.NumberFormat("en-US");

/** Axis ticks and anywhere space is tight: 41022 -> "41K". */
export const compact = (value) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : COMPACT.format(value);

/** Headline numbers, where every digit is the point: "41,022". */
export const num = (value) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : FULL.format(value);

/** Ratios arrive as 0..1. A null denominator renders as an em dash, never "0%". */
export const pct = (value, places = 1) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : `${(value * 100).toFixed(places)}%`;

export const dec = (value, places = 1) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : Number(value).toFixed(places);

/**
 * Axis label for a day key.
 *
 * Formats in UTC deliberately. The server buckets days in Eastern time and emits
 * "2026-08-11"; the client parses that as UTC midnight, so reading it back in UTC
 * returns the same calendar day. Using local time here would shift every label by
 * the viewer's offset and print Aug 10 for the launch day.
 */
const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});
export const dayLabel = (date) =>
  date instanceof Date ? DAY_LABEL.format(date) : String(date);

/** Day key -> Date. See dayLabel for why this is UTC midnight. */
export const parseDay = (key) => new Date(`${key}T00:00:00Z`);

/**
 * Hour-axis labels, e.g. "2pm", with midnight shown as the date ("Aug 12") so a
 * 24-hour axis reads unambiguously across the day boundary.
 *
 * Unlike dayLabel this formats in the dashboard's timezone, not UTC: hourly
 * buckets carry a real instant, so the local hour has to be derived here rather
 * than pre-baked into the key.
 */
export function hourLabelFactory(timeZone) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: true,
  });
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  const hourOnly = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  });
  return (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return Number(hourOnly.format(date)) === 0
      ? day.format(date)
      : hour.format(date).replace(/\s/g, "").toLowerCase();
  };
}

/** "+32%" / "−4%" / "—". Unicode minus so digits stay aligned. */
export const delta = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const rounded = Number(value.toFixed(1));
  if (rounded === 0) return "no change";
  return rounded > 0 ? `+${rounded}%` : `−${Math.abs(rounded)}%`;
};

export const relativeTime = (iso, nowMs = Date.now()) => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const seconds = Math.max(0, Math.round((nowMs - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};
