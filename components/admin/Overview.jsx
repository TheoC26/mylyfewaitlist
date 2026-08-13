"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Funnel from "./Funnel";
import Heatmap from "./Heatmap";
import RankedBars from "./RankedBars";
import {
  Approx,
  NotYet,
  Section,
  Segmented,
  Skeleton,
  Stat,
  StatGrid,
} from "./primitives";
import {
  compact,
  dec,
  hourLabelFactory,
  num,
  parseDay,
  pct,
  relativeTime,
} from "./format";

/**
 * The product dashboard: users, clips, engagement, the social loop and onboarding.
 *
 * Everything comes from one GET so there is one loading state and one refresh.
 *
 * Charts load through next/dynamic with ssr:false. d3 scales are pure, but the
 * <Chart> responsive path measures the DOM, and its initialWidth (640) would
 * otherwise be baked into the server HTML and visibly reflow on hydration.
 * Skipping SSR is cleaner than fighting it, and it keeps a pre-alpha renderer out
 * of the server bundle entirely.
 */

const TimeSeries = dynamic(() => import("./TimeSeries"), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});
const Bars = dynamic(() => import("./Bars"), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

const RANGES = [
  { value: 1, label: "24h" },
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: "all", label: "All" },
];
const PREFS_KEY = "mylyfe_admin_overview_prefs";
const STALE_AFTER_MS = 300_000;

export default function Overview({ api, onAuthError }) {
  const [prefs, setPrefs] = useState({
    days: 30,
    mode: "cumulative",
    includeDevs: false,
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const loadedAt = useRef(0);

  // Prefs live in sessionStorage, which does not exist during server render, so
  // they can only be read in an effect. `hydrated` gates the first fetch until
  // that has happened — otherwise a saved 24h pref would fire a 30d request and
  // then immediately supersede it, costing two full table scans on a cold cache.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PREFS_KEY) ?? "null");
      if (saved) setPrefs((p) => ({ ...p, ...saved }));
    } catch {
      /* a corrupt pref should not stop the dashboard rendering */
    }
    setHydrated(true);
  }, []);

  const savePrefs = (next) => {
    setPrefs(next);
    sessionStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const load = useCallback(
    async (refresh = false) => {
      setBusy(true);
      const params = new URLSearchParams({
        days: String(prefs.days),
        includeDevs: prefs.includeDevs ? "1" : "0",
      });
      if (refresh) params.set("refresh", "1");
      try {
        setData(await api(`?${params}`));
        setError("");
        loadedAt.current = Date.now();
      } catch (e) {
        setError(e.message);
        // Let the parent own the 401 path — it already clears the stored secret
        // and drops back to the login screen.
        if (e.message === "Wrong secret.") onAuthError?.();
      }
      setBusy(false);
    },
    [api, prefs.days, prefs.includeDevs, onAuthError],
  );

  useEffect(() => {
    if (hydrated) load();
  }, [load, hydrated]);

  // Keeps "Updated 12s ago" honest without refetching.
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  // Refetch on refocus only if the payload has actually gone stale. These numbers
  // move on a scale of hours and each request is a full scan, so polling would be
  // pure waste.
  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - loadedAt.current > STALE_AFTER_MS
      ) {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const hourly = data?.range.granularity === "hour";

  // Cumulative/per-bucket is a field swap, not a refetch — both are in the payload.
  // Hourly buckets carry a full instant; daily buckets carry an Eastern day key
  // that must be parsed as UTC midnight (see format.js).
  const growthRows = useMemo(
    () =>
      (data?.series ?? []).map((row) => ({
        date: hourly ? new Date(row.date) : parseDay(row.date),
        users: prefs.mode === "cumulative" ? row.cumUsers : row.newUsers,
        clips: prefs.mode === "cumulative" ? row.cumClips : row.clips,
        dau: row.dau,
        wau: row.wau,
        powerUsers: row.powerUsers,
        qualified: row.qualified,
      })),
    [data, prefs.mode, hourly],
  );

  const xFormat = useMemo(
    () => (hourly ? hourLabelFactory(data?.range.tz ?? "UTC") : undefined),
    [hourly, data?.range.tz],
  );

  const retentionRows = useMemo(
    () => (data?.retention ?? []).filter((r) => r.cohortSize > 0),
    [data],
  );

  if (!data && busy) return <LoadingSkeleton />;

  if (!data) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Could not load analytics."}</p>
        <button
          type="button"
          onClick={() => load(true)}
          className="mt-3 rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, friends, nudges, clipToNudge, montages, distributions, engagement, health } =
    data;
  const bucketWord = hourly ? "hour" : "day";
  const modeNote =
    prefs.mode === "cumulative" ? "Running total" : `Per ${bucketWord}`;
  const modes = [
    { value: "cumulative", label: "Total" },
    { value: "daily", label: hourly ? "Per hour" : "Daily" },
  ];
  // The last hourly bucket is the hour currently in progress, so it is always
  // partial and always dips. Saying so beats letting it read as a crash.
  const rangeNote = hourly
    ? "Trailing 24 hours · the last hour is still filling"
    : `${data.range.from} → ${data.range.to}`;

  return (
    <div className={`space-y-8 ${busy ? "opacity-60 transition-opacity" : ""}`}>
      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={RANGES}
            value={prefs.days}
            onChange={(days) => savePrefs({ ...prefs, days })}
            ariaLabel="Date range"
          />
          <Segmented
            options={modes}
            value={prefs.mode}
            onChange={(mode) => savePrefs({ ...prefs, mode })}
            ariaLabel="Growth chart mode"
          />
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={prefs.includeDevs}
              onChange={(e) =>
                savePrefs({ ...prefs, includeDevs: e.target.checked })
              }
              className="accent-black"
            />
            Include team ({health.developers})
          </label>
        </div>
        <p className="text-xs text-gray-400">
          Updated {relativeTime(data.generatedAt, tick)} ·{" "}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={busy}
            className="font-semibold text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-black disabled:text-gray-300"
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* headline */}
      <div className="grid gap-px bg-gray-200 sm:grid-cols-3">
        <Stat
          label="Users"
          value={num(kpis.totalUsers.value)}
          delta={kpis.totalUsers.deltaPct}
          big
        />
        <Stat
          label="Clips taken"
          value={num(kpis.totalClips.value)}
          delta={kpis.totalClips.deltaPct}
          big
        />
        <Stat
          label="Weekly active"
          value={num(kpis.wau.value)}
          delta={kpis.wau.deltaPct}
          sub={`${pct(kpis.wau.value / (kpis.totalUsers.value || 1), 0)} of all users`}
          big
        />
      </div>

      {/* growth — two panels, never one dual axis */}
      <Section title="Growth" note={`${modeNote} · ${rangeNote}`}>
        <div className="grid gap-8 lg:grid-cols-2">
          <ChartPanel title="Users">
            <TimeSeries
              rows={growthRows}
              series={[{ key: "users", label: "Users" }]}
              area
              xFormat={xFormat}
              ariaLabel={`${modeNote} users, ${rangeNote}`}
              ariaDescription={`Ends at ${num(kpis.totalUsers.value)} users.`}
            />
          </ChartPanel>
          <ChartPanel title="Clips">
            <TimeSeries
              rows={growthRows}
              series={[{ key: "clips", label: "Clips" }]}
              area
              xFormat={xFormat}
              ariaLabel={`${modeNote} clips, ${rangeNote}`}
              ariaDescription={`Ends at ${num(kpis.totalClips.value)} clips.`}
            />
          </ChartPanel>
        </div>
      </Section>

      {/* engagement — small multiples, because one shared axis would squash the smallest */}
      <Section
        title="Engagement"
        note={
          hourly
            ? "Weekly figures are the rolling 7-day window re-evaluated each hour"
            : "Rolling 7-day windows, so the numbers mean something from day two"
        }
      >
        <div className="grid gap-8 lg:grid-cols-3">
          {/* The first panel counts distinct users per bucket, so in hourly mode it
              is active-per-hour, not DAU. The other two stay rolling 7-day.
              The headline number reads from the last COMPLETE bucket, not the
              partial one still filling — the very last hourly bucket is often
              seconds old and would otherwise headline as "0 active", which reads
              as broken rather than as "not enough time has passed yet". */}
          <ChartPanel
            title={hourly ? "Active / hour" : "Daily active"}
            value={num(
              hourly
                ? (data.series.at(-2)?.dau ?? kpis.dau.value)
                : kpis.dau.value,
            )}
            note={hourly ? "Last complete hour" : undefined}
          >
            <TimeSeries
              rows={growthRows}
              series={[{ key: "dau", label: hourly ? "Active" : "DAU" }]}
              height={200}
              xFormat={xFormat}
              ariaLabel={
                hourly
                  ? "Distinct users clipping in each of the last 24 hours"
                  : "Daily active users over time"
              }
            />
          </ChartPanel>
          <ChartPanel title="Weekly active" value={num(kpis.wau.value)}>
            <TimeSeries
              rows={growthRows}
              series={[{ key: "wau", label: "WAU" }]}
              height={200}
              xFormat={xFormat}
              ariaLabel="Rolling seven-day weekly active users over time"
            />
          </ChartPanel>
          <ChartPanel
            title={`Power users · ${data.range.powerMinClips}+ clips`}
            value={num(kpis.powerUsers.value)}
          >
            <TimeSeries
              rows={growthRows}
              series={[{ key: "powerUsers", label: "Power users" }]}
              height={200}
              xFormat={xFormat}
              ariaLabel={`Users with ${data.range.powerMinClips} or more clips in the trailing seven days`}
            />
          </ChartPanel>
        </div>

        <StatGrid cols={4}>
          <Stat
            label="Montage-qualified"
            value={num(kpis.qualified.value)}
            delta={kpis.qualified.deltaPct}
            sub="3+ clips in 7d — earns a montage"
          />
          <Stat
            label="Clips / active user / wk"
            value={dec(kpis.clipsPerActiveWeek.value, 1)}
          />
          {/* DAU/MAU divides a 28-day average by a 28-day distinct count. Almost
              all of that window predates launch, so this reads artificially low
              until late September — say so rather than let it look like a verdict. */}
          <Stat
            label="Stickiness"
            value={pct(kpis.stickiness.value, 1)}
            sub={`DAU ${dec(kpis.dauAvg28.value, 0)} / MAU ${num(kpis.mau.value)} — the 28-day average still includes pre-launch days`}
          />
          <Stat
            label="Top 10% share of clips"
            value={pct(engagement.topDecileShareOfClips, 1)}
            sub={
              engagement.topDecileCutoff != null
                ? `${dec(engagement.topDecileCutoff, 0)}+ clips each`
                : undefined
            }
          />
        </StatGrid>
      </Section>

      {/* social loop */}
      <Section title="Friends & nudges">
        <StatGrid cols={4}>
          <Stat
            label="Avg friends"
            value={dec(friends.avgAllUsers, 2)}
            sub={`${dec(friends.avgConnected, 2)} among the connected`}
          />
          <Stat
            label="Have a friend"
            value={pct(1 - (friends.zeroFriendPct ?? 0), 0)}
            sub={`${num(friends.uniquePairs)} friendships`}
          />
          <Stat
            label="Nudge answer rate"
            value={pct(nudges.answerRate, 1)}
            sub={
              nudges.medianAnswerMinutes != null
                ? `median ${dec(nudges.medianAnswerMinutes, 0)} min to answer`
                : undefined
            }
          />
          <Stat
            label="Largest friend network"
            value={pct(friends.largestComponentPct, 0)}
            sub={`of users · ${num(friends.componentCount)} clusters`}
          />
        </StatGrid>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div>
            <PanelTitle>Nudges sent per user</PanelTitle>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Sent" value={num(nudges.sent)} />
              <Row label="Answered" value={num(nudges.answered)} />
              <Row
                label="Per active user"
                value={dec(nudges.avgSentPerActiveUser, 2)}
              />
              <Row
                label="Per person who sends"
                value={dec(nudges.avgSentPerSender, 2)}
              />
              <Row
                label="Returned per recipient"
                value={dec(nudges.avgReturnedPerRecipient, 2)}
              />
              <Row label="Re-nudged" value={pct(nudges.renudgeRate, 1)} />
            </dl>
          </div>
          <div className="lg:col-span-2">
            <PanelTitle>Friends per user</PanelTitle>
            <div className="mt-3">
              <Bars
                rows={distributions.friendsPerUser}
                xKey="bucket"
                yKey="count"
                yLabel="Users"
                ariaLabel="Distribution of friend counts per user"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* onboarding */}
      <Section title="Onboarding & retention">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <PanelTitle>Funnel</PanelTitle>
            <p className="mt-1 text-xs text-gray-400">
              Each step is “ever did this”, not a strict sequence — later steps can
              exceed earlier ones.
            </p>
            <div className="mt-4">
              <Funnel steps={data.funnel} />
            </div>
            {!health.tutorialInstrumented && (
              <p className="mt-3 text-xs text-gray-500">
                Onboarding completion is not shown because the app is not writing{" "}
                <code className="text-gray-600">tutorial_completed_at</code> — only{" "}
                {num(health.tutorialCompleted)} of {num(kpis.totalUsers.value)}{" "}
                profiles have it set. Worth fixing in the app; a 0% step here would
                just be the missing instrumentation, not real drop-off.
              </p>
            )}
            {data.funnelMature.cohortSize > 0 ? (
              <p className="mt-4 text-xs text-gray-400">
                Among the {num(data.funnelMature.cohortSize)} users who signed up
                7+ days ago,{" "}
                {pct(
                  data.funnelMature.steps.find((s) => s.key === "clip")?.pctOfTop,
                  0,
                )}{" "}
                have taken a clip.
              </p>
            ) : (
              <p className="mt-4 text-xs text-gray-400">
                No cohort is 7 days old yet — the mature funnel unlocks Aug 18.
              </p>
            )}
          </div>
          <div>
            <PanelTitle>Retention by signup cohort</PanelTitle>
            <p className="mt-1 text-xs text-gray-400">
              Only cohorts old enough to have had the chance are counted.
            </p>
            <div className="mt-4">
              {retentionRows.length > 1 ? (
                <TimeSeries
                  rows={retentionRows}
                  xKey="day"
                  xType="linear"
                  series={[
                    { key: "rate", label: "Clipped that exact day" },
                    { key: "rollingRate", label: "Clipped that day or later" },
                  ]}
                  height={220}
                  yFormat={(v) => `${Math.round(v * 100)}%`}
                  xFormat={(v) => `D${v}`}
                  xTickValues={retentionRows.map((r) => r.day)}
                  ariaLabel="Retention rate by days since signup"
                />
              ) : (
                <NotYet>
                  Not enough history yet — retention needs at least two mature
                  cohorts.
                </NotYet>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* behaviour */}
      <Section title="When clips are captured" note="Each clipper's own local time">
        <Heatmap
          counts={distributions.heatmap.counts}
          max={distributions.heatmap.max}
        />
      </Section>

      <Section title="Content & habits">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <PanelTitle>Top categories</PanelTitle>
            <div className="mt-3">
              <RankedBars
                rows={distributions.categories}
                labelKey="category"
                valueKey="count"
                pctKey="pct"
                empty="No categorised clips yet."
              />
            </div>
          </div>
          <div>
            <PanelTitle>Clips per user</PanelTitle>
            <div className="mt-3">
              <Bars
                rows={distributions.clipsPerUser}
                xKey="bucket"
                yKey="count"
                yLabel="Users"
                ariaLabel="Distribution of clip counts per user"
              />
            </div>
          </div>
          <div>
            <PanelTitle>Current streaks</PanelTitle>
            <div className="mt-3">
              <Bars
                rows={distributions.streaks}
                xKey="bucket"
                yKey="count"
                yLabel="Users"
                ariaLabel="Distribution of current streak lengths"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {num(engagement.activeStreakUsers)} on a live streak · longest ever{" "}
              {num(engagement.maxStreak)}
            </p>
          </div>
        </div>
      </Section>

      {/* montages */}
      <Section title="Montages">
        {montages.self.complete + montages.friends.complete + montages.self.failed ===
        0 ? (
          <NotYet>
            No montages built yet — they generate at the end of each week, so the
            first batch lands Sunday.
          </NotYet>
        ) : (
          <StatGrid cols={4}>
            <Stat
              label="Storylines (self)"
              value={num(montages.self.complete)}
              sub={`${pct(montages.self.completionRate, 0)} completion`}
            />
            <Stat
              label="Beat reels (friends)"
              value={num(montages.friends.complete)}
              sub={`${pct(montages.friends.completionRate, 0)} completion`}
            />
            <Stat
              label="Failed"
              value={num(health.failedMontages)}
              sub="across both flavors"
            />
            <Stat
              label="In flight"
              value={num(
                montages.self.queued +
                  montages.self.processing +
                  montages.friends.queued +
                  montages.friends.processing,
              )}
            />
          </StatGrid>
        )}
      </Section>

      {/* caveats + health */}
      <Section title="Approximations & data health">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-700">
              <span className="font-semibold tabular-nums text-black">
                {pct(clipToNudge.pctAmongUsersWithFriends, 1)}
              </span>{" "}
              of clips are followed by a nudge within {clipToNudge.windowMinutes}{" "}
              minutes
              <Approx />
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Among users who have at least one friend —{" "}
              {pct(clipToNudge.pctAllClips, 1)} across all clips.{" "}
              {num(clipToNudge.matchedClips)} of {num(clipToNudge.totalClips)}{" "}
              clips matched.
            </p>
            <p className="mt-1 text-xs text-gray-400">{clipToNudge.method}</p>
          </div>

          {!health.reconciliation.ok && (
            <p className="text-sm text-red-600">
              Row counts did not reconcile — some numbers here are understated.{" "}
              {health.reconciliation.mismatches
                .map((m) => `${m.table}: got ${m.fetched} of ${m.expected}`)
                .join("; ")}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs sm:grid-cols-3">
            <Row label="Waitlist signups" value={num(health.waitlistSignups)} />
            <Row label="Push opt-in" value={pct(kpis.pushOptInRate.value, 1)} />
            <Row label="Blocked clips" value={num(health.blockedClips)} />
            <Row
              label="Half-written friend pairs"
              value={num(health.halfWrittenFriendPairs)}
            />
            <Row
              label="Self-friend rows"
              value={num(health.selfFriendRows)}
            />
            <Row label="Stuck upload jobs" value={num(health.stuckProcessingJobs)} />
            <Row
              label="Profiles with no timezone"
              value={num(health.profilesMissingTimezone)}
            />
            <Row
              label="Avg Lyfe Score (decayed)"
              value={dec(engagement.avgLiveScore, 1)}
            />
            <Row
              label="Query time"
              value={`${num(data.computeMs)} ms${data.cacheAgeMs > 0 ? " (cached)" : ""}`}
            />
          </dl>
        </div>
      </Section>
    </div>
  );
}

function ChartPanel({ title, value, note, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <PanelTitle>{title}</PanelTitle>
        {value && (
          <span className="text-sm font-semibold tabular-nums text-black">
            {value}
          </span>
        )}
      </div>
      {note && <p className="mt-0.5 text-[11px] text-gray-400">{note}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PanelTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
      {children}
    </h3>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="shrink-0 font-semibold tabular-nums text-black">{value}</dd>
    </div>
  );
}

/** Same geometry as the loaded dashboard so nothing jumps when data arrives. */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-full" />
      <div className="grid gap-px bg-gray-200 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-9 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
      <p className="text-xs text-gray-400">
        Crunching every clip, nudge and friendship — the first load takes a few
        seconds.
      </p>
    </div>
  );
}
