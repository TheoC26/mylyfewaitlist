import { assertAdmin } from "@/lib/adminAuth";
import { isConfigured } from "@/lib/supabaseAdmin";
import { aggregate } from "@/lib/analytics/aggregate";
import { loadSnapshot } from "@/lib/analytics/read";
import { isValidTimeZone } from "@/lib/analytics/time";

/**
 * Product analytics for the admin Overview tab.
 *
 * One endpoint, one payload. Every metric derives from the same six table reads,
 * so splitting this into /kpis and /series would just read the same rows twice
 * and give the dashboard two loading states instead of one.
 *
 * Read-only, aggregates only, no PII. See lib/analytics/read.js.
 */

// The service-role client is Node-only, and a cached response here would be a
// dashboard that silently stops updating.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULTS = {
  days: 30,
  tz: "America/New_York",
  powerMinClips: 5,
  nudgeWindowMin: 10,
};
// days=1 is special: it switches the series to hourly buckets over the trailing
// 24 hours. Everything else stays daily.
const ALLOWED_DAYS = new Set([1, 7, 30, 90, 365]);

const FRESH_MS = 60_000;
const STALE_MS = 600_000;
const MAX_ENTRIES = 8;

/**
 * Stale-while-revalidate, keyed on the normalized params.
 *
 * Only the derived payload is cached (~50KB), never the raw snapshot — holding
 * tens of thousands of clip rows in a module-level map is a slow memory leak.
 *
 * The shared `inflight` promise matters: without it, two people opening the tab
 * at once, or one person refocusing it repeatedly, would each trigger a full
 * table scan.
 */
const cache = new Map();

function clamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
}

function parseParams(url) {
  const q = url.searchParams;

  const rawDays = q.get("days");
  let days = DEFAULTS.days;
  if (rawDays === "all") days = "all";
  else if (rawDays != null) {
    const n = Number(rawDays);
    if (!ALLOWED_DAYS.has(n)) return { error: "invalid_days" };
    days = n;
  }

  const tz = q.get("tz") ?? DEFAULTS.tz;
  if (!isValidTimeZone(tz)) return { error: "invalid_timezone" };

  return {
    params: {
      days,
      tz,
      includeDevs: q.get("includeDevs") === "1",
      powerMinClips: clamp(
        q.get("powerMinClips") ?? DEFAULTS.powerMinClips,
        1,
        50,
        DEFAULTS.powerMinClips,
      ),
      nudgeWindowMin: clamp(
        q.get("nudgeWindowMin") ?? DEFAULTS.nudgeWindowMin,
        1,
        120,
        DEFAULTS.nudgeWindowMin,
      ),
    },
    refresh: q.get("refresh") === "1",
  };
}

async function compute(params) {
  const startedAt = Date.now();
  const snapshot = await loadSnapshot();
  const payload = aggregate(snapshot, { ...params, now: new Date() });
  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    computeMs: Date.now() - startedAt,
  };
}

function evictOldest() {
  while (cache.size > MAX_ENTRIES) {
    let oldestKey = null;
    let oldestAt = Infinity;
    for (const [key, entry] of cache) {
      if (entry.at < oldestAt) {
        oldestAt = entry.at;
        oldestKey = key;
      }
    }
    cache.delete(oldestKey);
  }
}

async function load(key, params, refresh) {
  const entry = cache.get(key);
  const age = entry ? Date.now() - entry.at : Infinity;

  if (entry && !refresh && age < FRESH_MS) {
    return { payload: entry.payload, cacheAgeMs: age };
  }

  if (entry && !refresh && age < STALE_MS) {
    // Serve the stale copy now, refresh behind it. One shared promise so N
    // concurrent callers cause one scan.
    if (!entry.inflight) {
      entry.inflight = compute(params)
        .then((payload) => {
          cache.set(key, { payload, at: Date.now(), inflight: null });
          evictOldest();
        })
        .catch((err) => {
          console.error("[analytics] background refresh failed:", err.message);
          entry.inflight = null;
        });
    }
    return { payload: entry.payload, cacheAgeMs: age };
  }

  if (entry?.inflight) {
    await entry.inflight;
    const fresh = cache.get(key);
    if (fresh) return { payload: fresh.payload, cacheAgeMs: Date.now() - fresh.at };
  }

  const payload = await compute(params);
  cache.set(key, { payload, at: Date.now(), inflight: null });
  evictOldest();
  return { payload, cacheAgeMs: 0 };
}

export async function GET(req) {
  const denied = assertAdmin(req);
  if (denied) return denied;

  if (!isConfigured) {
    console.error(
      "[analytics] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
    );
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const parsed = parseParams(new URL(req.url));
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });

  const { params, refresh } = parsed;
  const key = JSON.stringify(params);

  try {
    const { payload, cacheAgeMs } = await load(key, params, refresh);
    return Response.json({ ...payload, cacheAgeMs });
  } catch (err) {
    // The real message names a table and can carry query detail; log it, don't
    // ship it. The admin page surfaces `error` verbatim.
    console.error("[analytics] query failed:", err);
    return Response.json({ error: "query_failed" }, { status: 503 });
  }
}
