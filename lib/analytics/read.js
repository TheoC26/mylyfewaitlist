import { supabaseAdmin } from "../supabaseAdmin.js";

/**
 * Reads the raw rows the dashboard aggregates. I/O only — no metric logic.
 *
 * PRIVACY: this module selects no usernames, emails, phone numbers or push
 * tokens' values, and the endpoint above it returns aggregates only. Nothing
 * that identifies a person crosses the wire.
 *
 * PAGINATION IS NOT OPTIONAL. PostgREST caps a response at 1000 rows and
 * returns the first page silently — no error, no flag. This has already caused
 * a production incident in this stack: see the comment at
 * mylyfeserver/src/controllers/waitlistController.js:318, where resolveAudience()
 * "quietly stopped resolving the tail of the list". Every read here counts
 * first, then fetches every page, and the caller reconciles the two.
 */

const PAGE_SIZE = 1000;
const MAX_PARALLEL = 6;

async function countRows(table, refine) {
  let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  if (refine) query = refine(query);
  const { count, error } = await query;
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

/**
 * Fetches every row, not just the first page.
 *
 * A stable sort key is what makes paging safe: without an explicit order,
 * Postgres may return rows in a different order per page and we would both
 * duplicate and miss rows.
 */
async function selectAll(table, columns, refine, { orderColumn = "id" } = {}) {
  const total = await countRows(table, refine);
  if (total === 0) return { rows: [], expected: 0 };

  const pages = Math.ceil(total / PAGE_SIZE);
  const rows = [];
  for (let start = 0; start < pages; start += MAX_PARALLEL) {
    const batch = [];
    for (let i = start; i < Math.min(start + MAX_PARALLEL, pages); i += 1) {
      batch.push(
        (async () => {
          let query = supabaseAdmin
            .from(table)
            .select(columns)
            .order(orderColumn, { ascending: true })
            .range(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE - 1);
          if (refine) query = refine(query);
          const { data, error } = await query;
          if (error) throw new Error(`${table}: ${error.message}`);
          return data ?? [];
        })(),
      );
    }
    for (const page of await Promise.all(batch)) rows.push(...page);
  }
  return { rows, expected: total };
}

/** `connections` has a composite primary key and no `id`, so it orders on user_low. */
const OK_CLIPS = (q) => q.eq("moderation_state", "ok");
const ACCEPTED = (q) => q.eq("status", "accepted");

export async function loadSnapshot() {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();

  const [
    profiles,
    clips,
    montages,
    relationships,
    nudges,
    connections,
    blockedClips,
    stuckJobs,
    missingTimezone,
    waitlistSignups,
  ] = await Promise.all([
    selectAll(
      "profiles",
      "id, created_at, timezone, tutorial_completed_at, expo_push_token, is_developer, streak_count, max_streak_count",
    ),
    selectAll(
      "clips",
      "id, user_id, clip_date, created_at, category, capture_timezone",
      OK_CLIPS,
    ),
    selectAll("montages", "id, user_id, week_end_date, flavor, status, completed_at"),
    selectAll("relationships", "id, user_id, friend_id", ACCEPTED),
    selectAll(
      "nudges",
      "id, from_user, to_user, created_at, expires_at, answered_at, renudge_count",
    ),
    selectAll(
      "connections",
      "user_low, user_high, score, last_updated, lifetime_exchanges",
      null,
      { orderColumn: "user_low" },
    ),
    countRows("clips", (q) => q.eq("moderation_state", "blocked")),
    countRows("processing_jobs", (q) =>
      q.eq("status", "processing").lt("updated_at", oneHourAgo),
    ),
    countRows("profiles", (q) => q.is("timezone", null)),
    countRows("waitlist_signups"),
  ]);

  return {
    profiles: profiles.rows,
    clips: clips.rows,
    montages: montages.rows,
    relationships: relationships.rows,
    nudges: nudges.rows,
    connections: connections.rows,
    counts: {
      blockedClips,
      stuckJobs,
      missingTimezone,
      waitlistSignups,
      // Independently-counted row totals. aggregate() compares these against
      // what it actually received so a truncated page surfaces as a visible
      // warning instead of quietly deflating every metric.
      expected: {
        profiles: profiles.expected,
        clips: clips.expected,
        nudges: nudges.expected,
        relationships: relationships.expected,
      },
    },
  };
}
