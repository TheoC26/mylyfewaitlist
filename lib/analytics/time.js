/**
 * Calendar bucketing for the analytics dashboard.
 *
 * Everything here exists because "how many clips today?" has no answer without
 * a timezone. A clip captured at 11:30pm Eastern on Aug 11 is already Aug 12 in
 * UTC, so bucketing naively would split every evening — the busiest part of the
 * day for this product — across two calendar days and flatten the launch spike.
 *
 * Intl.DateTimeFormat is the whole implementation. It knows every DST
 * transition; hand-rolled offset arithmetic does not. The 'en-CA' locale is not
 * cosmetic: it formats as YYYY-MM-DD, which is both the key format we want and
 * lexicographically sortable.
 *
 * Formatters are cached because constructing one costs ~50-200us and we call
 * these once per clip.
 */

const DAY_MS = 86_400_000;

/** Epoch day index of 1970-01-01 was a Thursday; Sunday=0 makes dow = (idx+4)%7. */
const EPOCH_DOW_OFFSET = 4;

const cache = new Map();

function formatter(kind, timeZone, options) {
  const key = `${kind}|${timeZone}`;
  let found = cache.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat("en-CA", { timeZone, ...options });
    } catch {
      // An unknown IANA string reaches us from clips.capture_timezone, which is
      // client-supplied. Degrade to UTC rather than throwing and losing the
      // whole request over one bad row.
      found = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", ...options });
    }
    cache.set(key, found);
  }
  return found;
}

export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== "string" || !timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "2026-08-11" — the local calendar day containing `instant`. */
export function dayKey(instant, timeZone) {
  return formatter("day", timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant instanceof Date ? instant : new Date(instant));
}

/**
 * { weekday, hour } in local time, weekday 0=Sunday. Used for the capture
 * heatmap, where the only meaningful clock is the one the clipper was looking at.
 *
 * hourCycle 'h23' rather than hour12:false — the latter renders midnight as "24"
 * under some locales, which would silently corrupt one row of the heatmap.
 */
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function hourWeekday(instant, timeZone) {
  const parts = formatter("hourWeekday", timeZone, {
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant instanceof Date ? instant : new Date(instant));

  let weekday = 0;
  let hour = 0;
  for (const part of parts) {
    if (part.type === "weekday") weekday = WEEKDAY_INDEX[part.value] ?? 0;
    else if (part.type === "hour") hour = Number(part.value) % 24;
  }
  return { weekday, hour };
}

/** Days since the epoch for a "YYYY-MM-DD" key. Cheap integer date arithmetic. */
export function dayIndex(key) {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const day = Number(key.slice(8, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** Inverse of dayIndex. */
export function keyFromIndex(index) {
  return new Date(index * DAY_MS).toISOString().slice(0, 10);
}

/** Day of week for a day key, 0=Sunday. */
export function dayOfWeek(key) {
  return (dayIndex(key) + EPOCH_DOW_OFFSET) % 7;
}

/** Inclusive list of day keys from `from` to `to`. */
export function dayRange(from, to) {
  const out = [];
  for (let i = dayIndex(from), end = dayIndex(to); i <= end; i += 1) {
    out.push(keyFromIndex(i));
  }
  return out;
}

const HOUR_MS = 3_600_000;

/**
 * Hourly buckets are indexed on ABSOLUTE elapsed hours, not a local hour string.
 *
 * Reconstructing an instant from a local "2026-08-12T14" label is a DST trap: one
 * such label is ambiguous and another does not exist. Absolute hour indices avoid
 * it entirely — an hour is an hour everywhere — and we format the bucket's start
 * instant in the display timezone only when labelling it.
 *
 * This aligns with local hour boundaries for any zone whose offset is a whole
 * number of hours, which includes America/New_York (UTC-4/-5). A zone offset by
 * :30 or :45 (Kolkata, Kathmandu) would see buckets straddling its hour marks.
 */
export const hourIndex = (instant) =>
  Math.floor((instant instanceof Date ? instant.getTime() : instant) / HOUR_MS);

export const instantFromHourIndex = (index) => new Date(index * HOUR_MS);

/** Inclusive list of absolute hour indices. */
export function hourRange(fromIndex, toIndex) {
  const out = [];
  for (let i = fromIndex; i <= toIndex; i += 1) out.push(i);
  return out;
}

/**
 * The local Sunday that ends the week containing `instant`.
 *
 * Mirrors getWeekEndDateFor() in mylyfeserver/src/utils/date.js — Monday-to-Sunday
 * weeks, with a Sunday belonging to the week it ends rather than the one it
 * starts. That is the boundary montages.week_end_date already uses, so any other
 * convention here would fail to join against real rows.
 */
export function weekEndKey(instant, timeZone) {
  const key = dayKey(instant, timeZone);
  const dow = (dayIndex(key) + EPOCH_DOW_OFFSET) % 7;
  return keyFromIndex(dayIndex(key) + ((7 - dow) % 7));
}

/**
 * Normalize a week_end_date read from Postgres.
 *
 * The column comes back as either "2026-08-16" or a full ISO timestamp depending
 * on how the row was written — montageScheduler.js writes .toISOString(). Both
 * must collapse to the same key or per-week grouping silently splits in two.
 */
export function normalizeDateColumn(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}
