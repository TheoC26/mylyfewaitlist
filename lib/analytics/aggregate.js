/**
 * Every metric on the admin Overview tab. Pure functions, zero I/O.
 *
 * The split from read.js is deliberate: several of these metrics have a
 * plausible-looking wrong answer that no amount of eyeballing the dashboard
 * would catch. Keeping them as pure transforms of a snapshot means they can be
 * checked against fixtures, and it keeps the traps documented next to the code
 * that avoids them:
 *
 *   - friendships are 1-or-2 rows, never reliably 2, so count(*)/2 is wrong
 *   - montages have two rows per user per week (self + friends), so an unsplit
 *     count is exactly 2x the truth
 *   - clips.clip_date is capture time, clips.created_at is upload time, and they
 *     can differ by days
 *   - a retention cohort that has not aged n days yet must not be in the D-n
 *     denominator
 *   - "clip followed by a nudge" is inferred from timestamps; there is no
 *     foreign key for it
 */

import {
  dayIndex,
  dayKey,
  dayRange,
  hourIndex,
  hourRange,
  hourWeekday,
  instantFromHourIndex,
  keyFromIndex,
  normalizeDateColumn,
  weekEndKey,
} from "./time.js";

/** Clips needed in a week to earn a montage: SOLO_MIN_CLIPS in mylyfeserver/src/cron/montageScheduler.js. */
export const MONTAGE_MIN_CLIPS = 3;

/** Lyfe Score decay, from mylyfeserver/src/config/lyfeScore.js. Keep in sync with that file. */
const HALF_LIFE_DAYS = 14;
const SCORE_FLOOR = 10;

const ROLLING_WINDOW_DAYS = 7;
const MAU_WINDOW_DAYS = 28;
const RETENTION_DAYS = [0, 1, 3, 7, 14, 28];
const CLIP_BUCKETS = [
  [0, 0, "0"],
  [1, 1, "1"],
  [2, 3, "2–3"],
  [4, 6, "4–6"],
  [7, 10, "7–10"],
  [11, Infinity, "11+"],
];
const STREAK_BUCKETS = [
  [0, 0, "0"],
  [1, 1, "1"],
  [2, 2, "2"],
  [3, 3, "3"],
  [4, 6, "4–6"],
  [7, 13, "7–13"],
  [14, 27, "14–27"],
  [28, Infinity, "28+"],
];
const TOP_CATEGORIES = 8;

/** Every ratio goes through here. A zero denominator is "no data", not zero. */
const ratio = (num, den) => (den > 0 ? num / den : null);

const round = (value, places = 2) =>
  value == null || !Number.isFinite(value)
    ? null
    : Number(value.toFixed(places));

function median(sorted) {
  if (!sorted.length) return null;
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function bucketize(values, buckets) {
  const counts = buckets.map(([, , label]) => ({ bucket: label, count: 0 }));
  for (const value of values) {
    const n = Number(value) || 0;
    for (let i = 0; i < buckets.length; i += 1) {
      if (n >= buckets[i][0] && n <= buckets[i][1]) {
        counts[i].count += 1;
        break;
      }
    }
  }
  return counts;
}

/** Index of the last element <= target, or -1. Both arrays are pre-sorted ascending. */
function lastAtOrBefore(times, target) {
  let lo = 0;
  let hi = times.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= target) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

const ms = (value) => (value ? new Date(value).getTime() : NaN);

/**
 * Union-find over friend pairs. Answers "is the friend graph one network or two
 * hundred islands of three?", which at this stage matters far more than density.
 */
function components(nodeIds, pairs) {
  const parent = new Map(nodeIds.map((id) => [id, id]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== root) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  for (const key of pairs) {
    const [a, b] = key.split("|");
    if (!parent.has(a) || !parent.has(b)) continue;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  const sizes = new Map();
  for (const id of nodeIds) {
    const root = find(id);
    sizes.set(root, (sizes.get(root) ?? 0) + 1);
  }
  // Isolated users are their own component; counting them would report ~2,500
  // "components" and say nothing. Only groups of 2+ are a network.
  let largest = 0;
  let count = 0;
  for (const size of sizes.values()) {
    if (size > 1) count += 1;
    if (size > largest) largest = size;
  }
  return { largestComponent: largest, componentCount: count };
}

export function aggregate(snapshot, options) {
  const {
    tz,
    days,
    powerMinClips,
    nudgeWindowMin,
    includeDevs,
    now = new Date(),
  } = options;

  const nowMs = now.getTime();
  const today = dayKey(now, tz);
  const todayIdx = dayIndex(today);

  // ---------------------------------------------------------------- population

  const devIds = new Set(
    snapshot.profiles.filter((p) => p.is_developer).map((p) => p.id),
  );
  const profiles = includeDevs
    ? snapshot.profiles
    : snapshot.profiles.filter((p) => !devIds.has(p.id));
  const isCounted = (userId) =>
    userId != null && (includeDevs || !devIds.has(userId));

  const totalUsers = profiles.length;
  const profileTz = new Map(profiles.map((p) => [p.id, p.timezone]));
  const signupIdx = new Map();
  const signupsPerDay = new Map();
  const signupsPerHour = new Map();
  for (const p of profiles) {
    if (!p.created_at) continue;
    const key = dayKey(p.created_at, tz);
    signupIdx.set(p.id, dayIndex(key));
    signupsPerDay.set(key, (signupsPerDay.get(key) ?? 0) + 1);
    const hour = hourIndex(ms(p.created_at));
    signupsPerHour.set(hour, (signupsPerHour.get(hour) ?? 0) + 1);
  }

  const clips = snapshot.clips.filter((c) => isCounted(c.user_id));
  const totalClips = clips.length;

  // ------------------------------------------------------------ clip pre-pass

  const clipsPerDay = new Map(); // dayKey -> count
  const clipDayUsers = new Map(); // dayKey -> Map<userId, clipCount>
  const clipsPerHour = new Map(); // absolute hour index -> count
  const clipHourUsers = new Map(); // absolute hour index -> Map<userId, clipCount>
  const clipsByUser = new Map(); // userId -> total
  const clipDaysByUser = new Map(); // userId -> Set<dayIdx>
  const lastClipIdx = new Map(); // userId -> latest dayIdx
  const weekUsers = new Map(); // weekEndKey -> Set<userId>
  const categories = new Map();
  const heat = new Int32Array(7 * 24);
  const perUserTimes = new Map(); // userId -> { capture: [], upload: [] } for nudge matching

  for (const clip of clips) {
    const captureMs = ms(clip.clip_date);
    if (!Number.isFinite(captureMs)) continue;

    const key = dayKey(captureMs, tz);
    const idx = dayIndex(key);
    clipsPerDay.set(key, (clipsPerDay.get(key) ?? 0) + 1);

    let dayMap = clipDayUsers.get(key);
    if (!dayMap) clipDayUsers.set(key, (dayMap = new Map()));
    dayMap.set(clip.user_id, (dayMap.get(clip.user_id) ?? 0) + 1);

    const hourBucket = hourIndex(captureMs);
    clipsPerHour.set(hourBucket, (clipsPerHour.get(hourBucket) ?? 0) + 1);
    let hourMap = clipHourUsers.get(hourBucket);
    if (!hourMap) clipHourUsers.set(hourBucket, (hourMap = new Map()));
    hourMap.set(clip.user_id, (hourMap.get(clip.user_id) ?? 0) + 1);

    clipsByUser.set(clip.user_id, (clipsByUser.get(clip.user_id) ?? 0) + 1);

    let dayset = clipDaysByUser.get(clip.user_id);
    if (!dayset) clipDaysByUser.set(clip.user_id, (dayset = new Set()));
    dayset.add(idx);
    if (idx > (lastClipIdx.get(clip.user_id) ?? -Infinity)) {
      lastClipIdx.set(clip.user_id, idx);
    }

    // Heatmap and week buckets use the clipper's own clock, matching the
    // precedence in mylyfeserver/src/director/localTime.js. The daily series
    // deliberately does not — one dashboard timezone keeps that x-axis coherent.
    const localZone = clip.capture_timezone || profileTz.get(clip.user_id) || tz;
    const week = weekEndKey(captureMs, localZone);
    let weekSet = weekUsers.get(week);
    if (!weekSet) weekUsers.set(week, (weekSet = new Set()));
    weekSet.add(clip.user_id);

    const { weekday, hour } = hourWeekday(captureMs, localZone);
    heat[weekday * 24 + hour] += 1;

    const category = clip.category || "other";
    categories.set(category, (categories.get(category) ?? 0) + 1);

    let times = perUserTimes.get(clip.user_id);
    if (!times) perUserTimes.set(clip.user_id, (times = { capture: [], upload: [] }));
    const uploadMs = ms(clip.created_at);
    times.capture.push({ t: captureMs, id: clip.id });
    times.upload.push({
      t: Number.isFinite(uploadMs) ? uploadMs : captureMs,
      id: clip.id,
    });
  }

  // Split into parallel sorted arrays so the nudge matcher can binary-search the
  // timestamps directly instead of rebuilding an array per nudge.
  for (const times of perUserTimes.values()) {
    for (const which of ["capture", "upload"]) {
      times[which].sort((a, b) => a.t - b.t);
      times[`${which}T`] = times[which].map((e) => e.t);
      times[`${which}Id`] = times[which].map((e) => e.id);
      times[which] = null;
    }
  }

  // The rendered window. `days: 'all'` walks back to the earliest real activity.
  const activityIndices = [
    ...[...signupsPerDay.keys()].map(dayIndex),
    ...[...clipsPerDay.keys()].map(dayIndex),
  ];
  const earliestIdx = activityIndices.length
    ? Math.min(...activityIndices)
    : todayIdx;
  const startIdx =
    days === "all"
      ? earliestIdx
      : Math.max(earliestIdx, todayIdx - (Number(days) - 1));
  const dayKeys = dayRange(keyFromIndex(startIdx), today);

  // days === 1 switches to hourly resolution over the trailing 24 hours. Rolling
  // rather than "today so far" so the view is always 24 full buckets — at 9am
  // a calendar-day view would be nine bars and would hide last night entirely.
  const granularity = days === 1 ? "hour" : "day";
  const nowHour = hourIndex(nowMs);
  const hourKeys = granularity === "hour" ? hourRange(nowHour - 23, nowHour) : [];

  // ------------------------------------------------------------------ friends

  const pairs = new Map(); // "lo|hi" -> directions seen (1 = half-written)
  // Production really does contain accepted rows where user_id === friend_id.
  // `nudges` has a nudges_no_self CHECK; `relationships` does not. A user is not
  // their own friend, so these are excluded from every friend metric and counted
  // in health instead.
  let selfFriendRows = 0;
  for (const row of snapshot.relationships) {
    if (!isCounted(row.user_id) || !isCounted(row.friend_id)) continue;
    if (row.user_id && row.user_id === row.friend_id) {
      selfFriendRows += 1;
      continue;
    }
    if (!row.user_id || !row.friend_id) continue;
    const [lo, hi] =
      row.user_id < row.friend_id
        ? [row.user_id, row.friend_id]
        : [row.friend_id, row.user_id];
    const key = `${lo}|${hi}`;
    pairs.set(key, (pairs.get(key) ?? 0) + 1);
  }
  const uniquePairs = pairs.size;
  const halfWrittenPairs = [...pairs.values()].filter((v) => v === 1).length;

  const degree = new Map();
  for (const key of pairs.keys()) {
    const [a, b] = key.split("|");
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const degrees = profiles.map((p) => degree.get(p.id) ?? 0);
  const connectedDegrees = degrees.filter((d) => d > 0).sort((a, b) => a - b);
  const sortedDegrees = [...degrees].sort((a, b) => a - b);
  const usersWithFriend = connectedDegrees.length;
  const graph = components(
    profiles.map((p) => p.id),
    pairs.keys(),
  );

  // ------------------------------------------------------------------- nudges

  const nudges = snapshot.nudges.filter(
    (n) => isCounted(n.from_user) && isCounted(n.to_user),
  );
  const nudgesSent = nudges.length;
  const answered = nudges.filter((n) => n.answered_at);
  const sentPerUser = new Map();
  const returnedPerUser = new Map();
  const nudgeTimesByUser = new Map();
  const answerMinutes = [];
  const nudgesPerDay = new Map();
  const nudgesPerHour = new Map();

  for (const n of nudges) {
    sentPerUser.set(n.from_user, (sentPerUser.get(n.from_user) ?? 0) + 1);
    const createdMs = ms(n.created_at);
    if (Number.isFinite(createdMs)) {
      const key = dayKey(createdMs, tz);
      nudgesPerDay.set(key, (nudgesPerDay.get(key) ?? 0) + 1);
      const hourBucket = hourIndex(createdMs);
      nudgesPerHour.set(hourBucket, (nudgesPerHour.get(hourBucket) ?? 0) + 1);
      let list = nudgeTimesByUser.get(n.from_user);
      if (!list) nudgeTimesByUser.set(n.from_user, (list = []));
      list.push(createdMs);
    }
    if (n.answered_at) {
      returnedPerUser.set(n.to_user, (returnedPerUser.get(n.to_user) ?? 0) + 1);
      const gap = ms(n.answered_at) - createdMs;
      if (Number.isFinite(gap) && gap >= 0) answerMinutes.push(gap / 60_000);
    }
  }
  for (const list of nudgeTimesByUser.values()) list.sort((a, b) => a - b);
  answerMinutes.sort((a, b) => a - b);

  const renudged = nudges.filter((n) => (n.renudge_count ?? 0) > 0).length;

  // --------------------------------------- clip -> nudge, the inferred metric

  // There is no triggered_by_clip_id column: the "now nudge someone" prompt is
  // client-side and leaves no server-side link. So this is timestamp proximity.
  //
  // Attribute each NUDGE to at most one clip rather than scanning forward from
  // each clip. Scanning forward is the direction that lies: a user who takes
  // five clips in ninety seconds and then nudges once would mark all five as
  // converted, inflating the rate by 5x.
  const windowMs = nudgeWindowMin * 60_000;
  const convertedClips = new Set();
  for (const [userId, times] of nudgeTimesByUser) {
    const clipTimes = perUserTimes.get(userId);
    if (!clipTimes) continue;
    for (const nudgeMs of times) {
      let best = null;
      let bestGap = Infinity;
      // Check both capture and upload orderings. clip_date is device-supplied
      // and can trail the upload by days, while the nudge is created by a server
      // call landing near upload — so neither timestamp alone finds every match.
      for (const which of ["capture", "upload"]) {
        const stamps = clipTimes[`${which}T`];
        const i = lastAtOrBefore(stamps, nudgeMs);
        if (i < 0) continue;
        const gap = nudgeMs - stamps[i];
        if (gap >= 0 && gap < bestGap) {
          bestGap = gap;
          best = clipTimes[`${which}Id`][i];
        }
      }
      if (best != null && bestGap <= windowMs) convertedClips.add(best);
    }
  }

  // Nudges are friends-only (createNudge throws 403 otherwise), so the
  // all-clips denominator is diluted by users who structurally cannot nudge.
  let clipsByFriendful = 0;
  let convertedByFriendful = 0;
  for (const clip of clips) {
    if ((degree.get(clip.user_id) ?? 0) > 0) {
      clipsByFriendful += 1;
      if (convertedClips.has(clip.id)) convertedByFriendful += 1;
    }
  }

  // ----------------------------------------------------------------- montages

  const montages = snapshot.montages.filter((m) => isCounted(m.user_id));
  const flavorStats = { self: null, friends: null };
  for (const flavor of ["self", "friends"]) {
    const rows = montages.filter((m) => m.flavor === flavor);
    const by = (status) => rows.filter((m) => m.status === status).length;
    const complete = by("complete");
    const failed = by("failed");
    flavorStats[flavor] = {
      complete,
      queued: by("queued"),
      processing: by("processing"),
      failed,
      completionRate: round(ratio(complete, complete + failed), 4),
    };
  }
  const montagesPerWeek = new Map();
  for (const m of montages) {
    const week = normalizeDateColumn(m.week_end_date);
    if (!week) continue;
    let row = montagesPerWeek.get(week);
    if (!row) montagesPerWeek.set(week, (row = { week, self: 0, friends: 0 }));
    if (m.flavor === "self" && m.status === "complete") row.self += 1;
    if (m.flavor === "friends" && m.status === "complete") row.friends += 1;
  }
  const usersWithMontage = new Set(
    montages.filter((m) => m.status === "complete").map((m) => m.user_id),
  );

  // ------------------------------------------------------------------- series

  // One loop serves both granularities. The only differences are the bucket
  // keys, how a key converts to an index, and how many buckets make up the
  // trailing 7-day window (7 days, or 168 hours).
  //
  // Rolling rather than calendar weeks throughout, because the app is days old:
  // a calendar-week series would have one point and would collapse to near-zero
  // every Monday. At hourly resolution the same rolling 7-day figure is
  // re-evaluated every hour, which is what makes intra-day growth visible.
  const hourly = granularity === "hour";
  const bucketKeys = hourly ? hourKeys : dayKeys;
  const indexOf = hourly ? (key) => key : dayIndex;
  const keyAt = hourly ? (index) => index : keyFromIndex;
  const windowSize = hourly
    ? ROLLING_WINDOW_DAYS * 24
    : ROLLING_WINDOW_DAYS;
  const signupsPer = hourly ? signupsPerHour : signupsPerDay;
  const clipsPer = hourly ? clipsPerHour : clipsPerDay;
  const bucketUsers = hourly ? clipHourUsers : clipDayUsers;
  const nudgesPer = hourly ? nudgesPerHour : nudgesPerDay;
  const startBucket = indexOf(bucketKeys[0]);

  // Cumulative totals are seeded with everything before the window, or a 7-day
  // view would show the product starting from zero this week.
  let cumUsers = 0;
  let cumClips = 0;
  for (const [key, count] of signupsPer) {
    if (indexOf(key) < startBucket) cumUsers += count;
  }
  for (const [key, count] of clipsPer) {
    if (indexOf(key) < startBucket) cumClips += count;
  }

  const windowCounts = new Map();
  const addBucket = (key) => {
    for (const [user, count] of bucketUsers.get(key) ?? []) {
      windowCounts.set(user, (windowCounts.get(user) ?? 0) + count);
    }
  };
  const dropBucket = (key) => {
    for (const [user, count] of bucketUsers.get(key) ?? []) {
      const next = (windowCounts.get(user) ?? 0) - count;
      if (next > 0) windowCounts.set(user, next);
      else windowCounts.delete(user);
    }
  };
  // Prime the window with the buckets immediately before the first rendered one.
  for (let i = startBucket - (windowSize - 1); i < startBucket; i += 1) {
    addBucket(keyAt(i));
  }

  const series = [];
  for (const key of bucketKeys) {
    const newUsers = signupsPer.get(key) ?? 0;
    const clipCount = clipsPer.get(key) ?? 0;
    cumUsers += newUsers;
    cumClips += clipCount;

    addBucket(key);
    dropBucket(keyAt(indexOf(key) - windowSize));

    let power = 0;
    let qualified = 0;
    for (const count of windowCounts.values()) {
      if (count >= powerMinClips) power += 1;
      if (count >= MONTAGE_MIN_CLIPS) qualified += 1;
    }

    series.push({
      // Daily emits the Eastern day key ("2026-08-11"); hourly emits the bucket's
      // start instant, because an hour label has to be formatted in the display
      // timezone rather than reconstructed from a string.
      date: hourly ? instantFromHourIndex(key).toISOString() : key,
      newUsers,
      cumUsers,
      clips: clipCount,
      cumClips,
      // Per-bucket actives: distinct users clipping that day, or that hour.
      dau: bucketUsers.get(key)?.size ?? 0,
      wau: windowCounts.size,
      powerUsers: power,
      qualified,
      nudges: nudgesPer.get(key) ?? 0,
    });
  }

  const first = series[0];
  const last = series[series.length - 1];

  // MAU and the 28-day DAU average are point-in-time, so compute them directly
  // rather than carrying a second rolling window through the loop.
  const mauUsers = new Set();
  let dauSum = 0;
  let dauDays = 0;
  for (let i = todayIdx - (MAU_WINDOW_DAYS - 1); i <= todayIdx; i += 1) {
    const key = keyFromIndex(i);
    for (const user of clipDayUsers.get(key)?.keys() ?? []) mauUsers.add(user);
    dauSum += clipDayUsers.get(key)?.size ?? 0;
    dauDays += 1;
  }
  const dauAvg28 = ratio(dauSum, dauDays);

  // ---------------------------------------------------------------- retention

  const retention = RETENTION_DAYS.map((offset) => {
    let cohort = 0;
    let exact = 0;
    let rolling = 0;
    for (const [userId, idx] of signupIdx) {
      // A cohort that has not yet had `offset` days to come back does not belong
      // in the denominator. Including it is the standard way to make D7 look
      // catastrophic on a product that is one week old.
      if (idx + offset > todayIdx) continue;
      cohort += 1;
      if (clipDaysByUser.get(userId)?.has(idx + offset)) exact += 1;
      if ((lastClipIdx.get(userId) ?? -Infinity) >= idx + offset) rolling += 1;
    }
    return {
      day: offset,
      cohortSize: cohort,
      rate: round(ratio(exact, cohort), 4),
      rollingRate: round(ratio(rolling, cohort), 4),
    };
  });

  // ------------------------------------------------------------------- funnel

  // profiles.tutorial_completed_at is set on a negligible fraction of real rows,
  // so the app is evidently not writing it. Rendering it as a funnel step would
  // read as ~100% onboarding drop-off when what is actually broken is the
  // instrumentation — so the step is dropped and reported in health instead.
  const tutorialCompleted = profiles.filter((p) => p.tutorial_completed_at).length;
  const tutorialInstrumented = (ratio(tutorialCompleted, totalUsers) ?? 0) > 0.02;

  const buildFunnel = (population) => {
    const steps = [
      ["signup", "Signed up", () => true],
      ...(tutorialInstrumented
        ? [["tutorial", "Finished onboarding", (p) => Boolean(p.tutorial_completed_at)]]
        : []),
      ["clip", "Took a clip", (p) => clipsByUser.has(p.id)],
      ["friend", "Added a friend", (p) => (degree.get(p.id) ?? 0) > 0],
      ["nudge", "Sent a nudge", (p) => sentPerUser.has(p.id)],
      ["montage", "Got a montage", (p) => usersWithMontage.has(p.id)],
    ];
    const top = population.length;
    let previous = top;
    return steps.map(([key, label, test]) => {
      const count = population.filter(test).length;
      const row = {
        key,
        label,
        count,
        pctOfTop: round(ratio(count, top), 4),
        pctOfPrev: round(ratio(count, previous), 4),
      };
      previous = count;
      return row;
    });
  };
  const mature = profiles.filter(
    (p) => (signupIdx.get(p.id) ?? Infinity) + 7 <= todayIdx,
  );

  // -------------------------------------------------------------- connections

  const liveScores = [];
  let lifetimeExchanges = 0;
  for (const c of snapshot.connections) {
    if (!isCounted(c.user_low) || !isCounted(c.user_high)) continue;
    lifetimeExchanges += c.lifetime_exchanges ?? 0;
    const ageDays = (nowMs - ms(c.last_updated)) / 86_400_000;
    if (!Number.isFinite(ageDays)) continue;
    liveScores.push((c.score ?? 0) * Math.pow(0.5, ageDays / HALF_LIFE_DAYS));
  }

  // ---------------------------------------------------------------- top decile

  const clipCounts = [...clipsByUser.values()].sort((a, b) => a - b);
  const decileCutoff = quantile(clipCounts, 0.9);
  const topDecileClips = clipCounts
    .filter((n) => n >= (decileCutoff ?? Infinity))
    .reduce((a, b) => a + b, 0);

  const withToken = profiles.filter(
    // Both halves matter: older rows hold '' as well as NULL, and checking only
    // for NULL counts empty-string rows as reachable.
    (p) => p.expo_push_token != null && p.expo_push_token !== "",
  ).length;

  const delta = (value, prev) => ({
    value,
    prev,
    deltaPct:
      prev == null || prev === 0 || value == null
        ? null
        : round(((value - prev) / prev) * 100, 1),
  });

  return {
    range: {
      tz,
      days,
      granularity,
      from: hourly ? series[0]?.date : dayKeys[0],
      to: hourly ? series[series.length - 1]?.date : today,
      powerMinClips,
      nudgeWindowMin,
      includeDevs,
    },

    kpis: {
      totalUsers: delta(totalUsers, first ? first.cumUsers - first.newUsers : null),
      totalClips: delta(totalClips, first ? first.cumClips - first.clips : null),
      wau: delta(last?.wau ?? 0, first?.wau ?? null),
      dau: delta(last?.dau ?? 0, first?.dau ?? null),
      dauAvg28: delta(round(dauAvg28, 1), null),
      mau: delta(mauUsers.size, null),
      qualified: delta(last?.qualified ?? 0, first?.qualified ?? null),
      powerUsers: delta(last?.powerUsers ?? 0, first?.powerUsers ?? null),
      montagesComplete: delta(
        flavorStats.self.complete + flavorStats.friends.complete,
        null,
      ),
      avgFriends: delta(round(ratio(2 * uniquePairs, totalUsers)), null),
      nudgeAnswerRate: delta(round(ratio(answered.length, nudgesSent), 4), null),
      pushOptInRate: delta(round(ratio(withToken, totalUsers), 4), null),
      stickiness: delta(round(ratio(dauAvg28, mauUsers.size), 4), null),
      clipsPerActiveWeek: delta(
        round(ratio(last?.wau ? sumWindowClips(windowCounts) : 0, last?.wau ?? 0)),
        null,
      ),
    },

    series,

    friends: {
      uniquePairs,
      usersWithFriend,
      avgAllUsers: round(ratio(2 * uniquePairs, totalUsers)),
      avgConnected: round(
        ratio(
          connectedDegrees.reduce((a, b) => a + b, 0),
          usersWithFriend,
        ),
      ),
      median: median(sortedDegrees),
      p90: round(quantile(sortedDegrees, 0.9), 1),
      zeroFriendPct: round(ratio(totalUsers - usersWithFriend, totalUsers), 4),
      largestComponentPct: round(ratio(graph.largestComponent, totalUsers), 4),
      componentCount: graph.componentCount,
    },

    nudges: {
      sent: nudgesSent,
      answered: answered.length,
      answerRate: round(ratio(answered.length, nudgesSent), 4),
      avgSentPerActiveUser: round(ratio(nudgesSent, clipsByUser.size)),
      avgSentPerSender: round(ratio(nudgesSent, sentPerUser.size)),
      avgReturnedPerRecipient: round(
        ratio(answered.length, returnedPerUser.size),
      ),
      medianAnswerMinutes: round(median(answerMinutes), 1),
      renudgeRate: round(ratio(renudged, nudgesSent), 4),
    },

    clipToNudge: {
      approximate: true,
      windowMinutes: nudgeWindowMin,
      matchedClips: convertedClips.size,
      totalClips,
      pctAllClips: round(ratio(convertedClips.size, totalClips), 4),
      pctAmongUsersWithFriends: round(
        ratio(convertedByFriendful, clipsByFriendful),
        4,
      ),
      method:
        "Timestamp proximity. There is no triggered_by_clip_id column, so each nudge is " +
        "attributed to the single most recent clip by the same user within the window " +
        "(capture or upload time, whichever gap is smaller). Users with no friends cannot " +
        "nudge at all, and a user may hold only one active outgoing nudge at a time.",
    },

    montages: {
      ...flavorStats,
      perWeek: [...montagesPerWeek.values()].sort((a, b) =>
        a.week < b.week ? -1 : 1,
      ),
    },

    retention,
    funnel: buildFunnel(profiles),
    funnelMature: { cohortSize: mature.length, steps: buildFunnel(mature) },

    distributions: {
      heatmap: { counts: Array.from(heat), max: Math.max(0, ...heat) },
      clipsPerUser: bucketize(
        profiles.map((p) => clipsByUser.get(p.id) ?? 0),
        CLIP_BUCKETS,
      ),
      friendsPerUser: bucketize(degrees, CLIP_BUCKETS),
      streaks: bucketize(
        profiles.map((p) => p.streak_count ?? 0),
        STREAK_BUCKETS,
      ),
      categories: [...categories.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_CATEGORIES)
        .map(([category, count]) => ({
          category,
          count,
          pct: round(ratio(count, totalClips), 4),
        })),
    },

    engagement: {
      topDecileCutoff: round(decileCutoff, 1),
      topDecileShareOfClips: round(ratio(topDecileClips, totalClips), 4),
      activeStreakUsers: profiles.filter((p) => (p.streak_count ?? 0) >= 1).length,
      maxStreak: profiles.reduce(
        (best, p) => Math.max(best, p.max_streak_count ?? 0),
        0,
      ),
      avgLiveScore: round(
        ratio(
          liveScores.reduce((a, b) => a + b, 0),
          liveScores.length,
        ),
        1,
      ),
      pctAboveFloor: round(
        ratio(liveScores.filter((s) => s > SCORE_FLOOR).length, liveScores.length),
        4,
      ),
      avgLifetimeExchanges: round(
        ratio(lifetimeExchanges, snapshot.connections.length),
      ),
    },

    health: {
      developers: devIds.size,
      blockedClips: snapshot.counts.blockedClips,
      halfWrittenFriendPairs: halfWrittenPairs,
      selfFriendRows,
      tutorialInstrumented,
      tutorialCompleted,
      failedMontages: flavorStats.self.failed + flavorStats.friends.failed,
      stuckProcessingJobs: snapshot.counts.stuckJobs,
      profilesMissingTimezone: snapshot.counts.missingTimezone,
      waitlistSignups: snapshot.counts.waitlistSignups,
      // Independently-counted totals vs what we actually aggregated. A mismatch
      // means a paginated read was truncated, which is the failure mode that
      // produces confidently wrong numbers rather than an error.
      reconciliation: reconcile(snapshot, {
        profiles: snapshot.profiles.length,
        clips: snapshot.clips.length,
        nudges: snapshot.nudges.length,
        relationships: snapshot.relationships.length,
      }),
    },
  };
}

/** Total clips inside the current rolling window, for clips-per-active-user. */
function sumWindowClips(windowCounts) {
  let total = 0;
  for (const count of windowCounts.values()) total += count;
  return total;
}

function reconcile(snapshot, fetched) {
  const expected = snapshot.counts.expected ?? {};
  const mismatches = [];
  for (const [table, count] of Object.entries(fetched)) {
    const want = expected[table];
    if (typeof want === "number" && want !== count) {
      mismatches.push({ table, expected: want, fetched: count });
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}
