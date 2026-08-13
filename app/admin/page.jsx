"use client";

import { useCallback, useEffect, useState } from "react";
import Overview from "@/components/admin/Overview";

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || "").replace(
  /\/$/,
  "",
);

/**
 * Internal tool. Four jobs: watch how the product is doing, approve or reject the
 * videos people upload, send an email to the waitlist, and push a notification to
 * people who already have the app.
 *
 * The overview tab is the only one backed by this app rather than the API server:
 * it queries Supabase directly from a route handler in app/api/admin/analytics.
 *
 * The moderation half is not a nicety. Nothing in this stack does automated
 * content checking, so every uploaded video sits at status='pending' until a
 * human looks at it — which means the only thing standing between an arbitrary
 * upload and the public homepage is somebody working through this queue. Doing
 * that over curl for several hundred clips is hours of work; this pays for
 * itself immediately.
 *
 * The push tab is the only channel that reaches an installed app. Email goes
 * to the waitlist — addresses typed on this site — which is a different set of
 * people from the ones holding a build that needs updating.
 *
 * Auth is the CRON_SECRET, typed in and held in sessionStorage — never in the
 * URL, where it would end up in history, referrers and server logs. It is
 * deliberately plain: this is a page for one person, not a product surface.
 */
export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("mylyfe_admin_secret");
    if (saved) {
      setSecret(saved);
      setAuthed(true);
    }
  }, []);

  // Three admin surfaces behind one secret, across TWO origins. /api/waitlist/admin
  // and /api/admin/push live on the API server; /api/admin/analytics is a route
  // handler in this app, because that is where the Supabase service-role key lives.
  // So the origin has to be a parameter — hardcoding API_BASE here sends the
  // analytics call to the Express server, which 404s.
  const requestTo = useCallback(
    async (base, path, options = {}) => {
      const res = await fetch(`${base}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": secret,
          ...(options.headers || {}),
        },
      });
      if (res.status === 401) throw new Error("Wrong secret.");
      if (!res.ok) {
        // The server names what it rejected; a bare status code would leave
        // "Request failed (400)" as the only clue about a bad payload.
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error || `Request failed (${res.status})`);
      }
      return res.json();
    },
    [secret],
  );

  const api = useCallback(
    (path, options) => requestTo(API_BASE, `/api/waitlist/admin${path}`, options),
    [requestTo],
  );

  const pushApi = useCallback(
    (path, options) => requestTo(API_BASE, `/api/admin/push${path}`, options),
    [requestTo],
  );

  // Empty base — a relative URL, so this hits this app's own route handler.
  const analyticsApi = useCallback(
    (path, options) => requestTo("", `/api/admin/analytics${path}`, options),
    [requestTo],
  );

  const loadStats = useCallback(async () => {
    try {
      setStats(await api("/stats"));
      setError("");
    } catch (e) {
      setError(e.message);
      setAuthed(false);
      sessionStorage.removeItem("mylyfe_admin_secret");
    }
  }, [api]);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  // bg-white / text-black are set explicitly on both <main>s below: the site
  // has no dark-mode styling, so without them a dark-mode browser paints its
  // own dark background underneath our black text.
  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-white px-6 text-black">
        <h1 className="text-xl font-bold">MyLyfe admin</h1>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("mylyfe_admin_secret", secret);
            setAuthed(true);
          }}
        >
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="CRON_SECRET"
            className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-base outline-none focus:border-black"
            autoComplete="off"
          />
          <button
            type="submit"
            className="mt-3 w-full rounded-md bg-black px-4 py-3 text-sm font-semibold text-white"
          >
            Enter
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      {/* The dashboard needs the extra width for side-by-side charts; the other
          tabs are read-and-decide queues that stay easier at the narrower measure. */}
      <div className={tab === "overview" ? "mx-auto max-w-7xl" : "mx-auto max-w-5xl"}>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-xl font-bold">MyLyfe admin</h1>
          {stats && (
            <p className="text-sm text-gray-500">
              {stats.signups.toLocaleString()} signups &middot;{" "}
              <strong className="text-black">{stats.pendingVideos}</strong>{" "}
              pending &middot; {stats.approvedVideos} live
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-6 border-b border-gray-200">
          {["overview", "moderate", "broadcast", "push"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize ${
                tab === t
                  ? "border-black text-black"
                  : "border-transparent text-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8">
          {tab === "overview" && (
            <Overview
              api={analyticsApi}
              onAuthError={() => {
                setAuthed(false);
                sessionStorage.removeItem("mylyfe_admin_secret");
              }}
            />
          )}
          {tab === "moderate" && (
            <Moderate api={api} secret={secret} onChange={loadStats} />
          )}
          {tab === "broadcast" && <Broadcast api={api} />}
          {tab === "push" && <Push api={pushApi} />}
        </div>
      </div>
    </main>
  );
}

function Moderate({ api, secret, onChange }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/pending");
      setVideos(data.videos);
    } catch {
      /* surfaced by the parent's stats call */
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, verdict) => {
    setWorking(id);
    try {
      const note =
        verdict === "reject"
          ? (window.prompt("Why? (shown to them, optional)") ?? "")
          : undefined;
      await api(`/videos/${id}/${verdict}`, {
        method: "POST",
        body: JSON.stringify(note ? { note } : {}),
      });
      setVideos((v) => v.filter((x) => x.id !== id));
      onChange();
      // Drop the homepage's cached copy so the change is visible now rather
      // than up to ten minutes later. Best-effort on purpose: the moderation
      // decision is already saved, and a failed cache bust only means the
      // homepage catches up on its own schedule.
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "x-cron-secret": secret },
      }).catch(() => {});
    } catch (e) {
      alert(e.message);
    }
    setWorking(null);
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  if (!videos.length) {
    return (
      <p className="text-sm text-gray-500">
        Nothing waiting. Everything uploaded has been reviewed.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((v) => (
        <div key={v.id}>
          <div className="overflow-hidden rounded-lg bg-gray-100">
            {/* Not autoplaying: a wall of simultaneous video makes the queue
                unreviewable and hammers the decoder. Hover or tap to play. */}
            <video
              src={v.videoUrl}
              poster={v.posterUrl}
              muted
              loop
              playsInline
              preload="none"
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => e.currentTarget.pause()}
              onClick={(e) =>
                e.currentTarget.paused
                  ? e.currentTarget.play().catch(() => {})
                  : e.currentTarget.pause()
              }
              className="block aspect-[9/16] w-full cursor-pointer object-cover"
            />
          </div>
          <p className="mt-2 truncate text-xs text-gray-400">
            #{v.position} &middot; {Number(v.durationSec).toFixed(1)}s
          </p>
          <div className="mt-2 flex gap-2">
            <button
              disabled={working === v.id}
              onClick={() => decide(v.id, "approve")}
              className="flex-1 rounded-md bg-black py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Approve
            </button>
            <button
              disabled={working === v.id}
              onClick={() => decide(v.id, "reject")}
              className="flex-1 rounded-md border border-gray-300 py-2 text-xs font-semibold text-gray-600 disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const AUDIENCES = [
  { value: "all", label: "Everyone on the list" },
  { value: "first1000", label: "First 1,000 only" },
  { value: "no_video", label: "Haven't uploaded a video" },
  { value: "has_approved_video", label: "Have a video on the wall" },
];

/** Survives a reload, which the in-flight broadcast id previously did not. */
const IN_FLIGHT_KEY = "mylyfe_admin_broadcast_id";

function Broadcast({ api }) {
  const [subject, setSubject] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  // The send being worked on: its id, and progress as the server reports it.
  // While this is set the composer is locked — the server sends the stored
  // copy, so an editable form would be lying about what goes out.
  const [active, setActive] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory((await api("/broadcasts")).broadcasts);
    } catch {
      /* non-critical */
    }
  }, [api]);

  /** Load a broadcast into the composer, with its progress. */
  const open = useCallback(
    async (id) => {
      try {
        const b = await api(`/broadcasts/${id}`);
        setSubject(b.subject);
        setBodyMd(b.bodyMd);
        setCtaLabel(b.ctaLabel);
        setCtaHref(b.ctaHref);
        setAudience(b.audience);
        setActive(b);
        sessionStorage.setItem(IN_FLIGHT_KEY, id);
        return b;
      } catch (e) {
        setStatus(e.message);
        sessionStorage.removeItem(IN_FLIGHT_KEY);
        return null;
      }
    },
    [api],
  );

  useEffect(() => {
    loadHistory();
    // Pick the interrupted send back up after a reload — the case that caused
    // 200 people to be mailed twice on launch day.
    const id = sessionStorage.getItem(IN_FLIGHT_KEY);
    if (id) open(id);
  }, [loadHistory, open]);

  const discard = () => {
    sessionStorage.removeItem(IN_FLIGHT_KEY);
    setActive(null);
    setStatus("");
  };

  const payload = () => ({ subject, bodyMd, audience, ctaLabel, ctaHref });

  const sendTest = async () => {
    setSending(true);
    setStatus("Sending test…");
    try {
      const r = await api("/broadcast", {
        method: "POST",
        body: JSON.stringify({ ...payload(), testOnly: true }),
      });
      setStatus(r.ok ? `Test sent to ${r.to}.` : `Test failed: ${r.error}`);
    } catch (e) {
      setStatus(e.message);
    }
    setSending(false);
  };

  /**
   * Sent in chunks, in a loop, because a full send takes far longer than App
   * Runner will hold one request open.
   *
   * The id of the send in progress goes to sessionStorage before the first
   * chunk, not after the last. That ordering is the whole fix: it used to live
   * in a local variable, so a reload mid-send lost it, the next attempt opened
   * a fresh broadcast, and the people at the top of the list were mailed a
   * second time. The server now also skips anyone already mailed this subject
   * under any attempt, so even a lost id cannot duplicate.
   */
  const run = async (resumeId) => {
    setSending(true);
    let broadcastId = resumeId;
    let sent = 0;
    let failed = 0;

    try {
      for (;;) {
        const r = await api("/broadcast", {
          method: "POST",
          // Resuming sends the id ALONE: the server reads the stored copy and
          // ignores the composer, so the second half of the list cannot get a
          // different email from the first half.
          body: JSON.stringify(broadcastId ? { broadcastId } : payload()),
        });

        if (!broadcastId) {
          broadcastId = r.broadcastId;
          sessionStorage.setItem(IN_FLIGHT_KEY, broadcastId);
        }

        sent += r.sent;
        failed += r.failed;
        setActive((a) => ({
          ...(a ?? {}),
          id: broadcastId,
          subject: r.subject,
          total: r.total,
          mailed: r.mailed,
          remaining: r.remaining,
        }));
        setStatus(
          `Sending… ${r.mailed} of ${r.total}${failed ? ` · ${failed} failed` : ""}`,
        );
        if (r.remaining === 0) break;
      }

      setStatus(
        `Done — ${sent} sent this run${failed ? `, ${failed} failed` : ""}.`,
      );
      sessionStorage.removeItem(IN_FLIGHT_KEY);
      loadHistory();
    } catch (e) {
      setStatus(
        `Stopped: ${e.message} — press Resume to carry on. Nobody gets a second copy.`,
      );
      // Deliberately keeps the id in sessionStorage: this is exactly when it
      // is needed.
      if (broadcastId) open(broadcastId);
    }
    setSending(false);
  };

  const sendReal = async () => {
    if (
      !window.confirm(
        `Send "${subject}" to: ${AUDIENCES.find((a) => a.value === audience).label}?`,
      )
    ) {
      return;
    }
    run(null);
  };

  const ready = subject.trim() && bodyMd.trim();
  const locked = Boolean(active);
  const pct =
    active?.total > 0 ? Math.round((active.mailed / active.total) * 100) : 0;

  const field =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div>
        {active && (
          <div className="mb-6 rounded-md border border-gray-300 p-4">
            <p className="text-sm font-semibold">
              {active.remaining === 0 ? "Finished" : "In progress"} ·{" "}
              {active.subject}
            </p>

            <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-black transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {(active.mailed ?? 0).toLocaleString()} of{" "}
              {(active.total ?? 0).toLocaleString()} emailed ({pct}%) ·{" "}
              {(active.remaining ?? 0).toLocaleString()} to go
              {active.failedByThisAttempt
                ? ` · ${active.failedByThisAttempt} failed`
                : ""}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {active.remaining > 0 && (
                <button
                  disabled={sending}
                  onClick={() => run(active.id)}
                  className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Resume"}
                </button>
              )}
              <button
                disabled={sending}
                onClick={discard}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {active.remaining === 0 ? "Write a new one" : "Set aside"}
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Resume sends the copy saved with this broadcast, not what is in
              the boxes below — so everyone on the list gets the same email.
              Anyone already emailed this subject is skipped, including from
              earlier attempts.
            </p>
          </div>
        )}

        <label className="block text-sm font-semibold">Subject</label>
        <input
          value={subject}
          disabled={locked}
          onChange={(e) => setSubject(e.target.value)}
          className={field}
        />

        <label className="mt-5 block text-sm font-semibold">Body</label>
        <p className="text-xs text-gray-400">Blank lines become paragraphs.</p>
        <textarea
          value={bodyMd}
          disabled={locked}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={10}
          className={field}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold">Button label</label>
            <input
              value={ctaLabel}
              disabled={locked}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="optional"
              className={field}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Button link</label>
            <input
              value={ctaHref}
              disabled={locked}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="https://…"
              className={field}
            />
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold">Audience</label>
        <select
          value={audience}
          disabled={locked}
          onChange={(e) => setAudience(e.target.value)}
          className={field}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Anyone who unsubscribed is always excluded.
        </p>

        {!locked && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={!ready || sending}
              onClick={sendTest}
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              Send test to me
            </button>
            <button
              disabled={!ready || sending}
              onClick={sendReal}
              className="rounded-md bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Send for real
            </button>
          </div>
        )}

        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Recent sends</h2>
        {!history.length ? (
          <p className="mt-2 text-xs text-gray-400">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {history.map((b) => (
              <li key={b.id} className="text-xs">
                <p className="truncate font-medium text-black">{b.subject}</p>
                <p className="text-gray-400">
                  {b.sent_count} sent
                  {b.failed_count
                    ? `, ${b.failed_count} failed`
                    : ""} &middot; {b.sent_at ? "complete" : "in progress"}
                </p>
                {!b.sent_at && b.id !== active?.id && (
                  <button
                    disabled={sending}
                    onClick={() => open(b.id)}
                    className="mt-0.5 underline decoration-gray-300 disabled:opacity-40"
                  >
                    open &amp; resume
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const PUSH_TITLE_MAX = 100;
const PUSH_BODY_MAX = 400;

/**
 * Push a notification to people who have the app.
 *
 * Two targets, because they answer two different needs. An audience send goes
 * to every device we can reach and is the only way to tell existing installs
 * that a new build exists — nothing in an app that is never opened announces
 * its own update. Picking people by hand covers the other case: sending one
 * notification to one device, usually this one, to photograph it.
 *
 * The audience send loops, feeding each response's cursor into the next
 * request, because the server hands back one page at a time. Unlike the email
 * broadcast there is no dedupe ledger behind it: the cursor makes an
 * interrupted run resumable, but starting over starts over, so send once.
 */
function Push({ api }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [audiences, setAudiences] = useState({});
  const [counts, setCounts] = useState({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const loadAudiences = useCallback(async () => {
    try {
      const r = await api("/audiences");
      setAudiences(r.audiences);
      setCounts(r.counts);
    } catch (e) {
      setStatus(e.message);
    }
  }, [api]);

  useEffect(() => {
    loadAudiences();
  }, [loadAudiences]);

  // Debounced so typing a name is one request rather than one per keystroke.
  useEffect(() => {
    if (target !== "picked") return;
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setResults((await api(`/users?q=${encodeURIComponent(term)}`)).users);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, target, api]);

  const toggle = (user) =>
    setPicked((current) =>
      current.some((p) => p.id === user.id)
        ? current.filter((p) => p.id !== user.id)
        : [...current, user],
    );

  const send = async () => {
    const label =
      target === "picked"
        ? `${picked.length} ${picked.length === 1 ? "person" : "people"}`
        : `${audiences[target]} — ${counts[target] ?? "?"} devices`;

    if (!window.confirm(`Push "${title}" to ${label}?\n\nThis cannot be undone.`)) {
      return;
    }

    setSending(true);
    setStatus("Sending…");

    let sent = 0;
    let failed = 0;
    let dead = 0;
    let unreachable = [];

    try {
      if (target === "picked") {
        const r = await api("/send", {
          method: "POST",
          body: JSON.stringify({ title, body, userIds: picked.map((p) => p.id) }),
        });
        sent = r.sent;
        failed = r.failed;
        dead = r.deadCleared;
        unreachable = r.noToken;
      } else {
        let cursor = null;
        for (;;) {
          const r = await api("/send", {
            method: "POST",
            body: JSON.stringify({ title, body, audience: target, cursor }),
          });
          sent += r.sent;
          failed += r.failed;
          dead += r.deadCleared;
          setStatus(`Sent ${sent}…`);
          if (!r.nextCursor) break;
          cursor = r.nextCursor;
        }
      }

      setStatus(
        [
          `Done — ${sent} delivered to Expo`,
          failed ? `${failed} failed` : "",
          dead ? `${dead} dead tokens cleared` : "",
          unreachable.length ? `no app installed: ${unreachable.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      );
      // Dead tokens shrink the audience; keep the header counts honest.
      loadAudiences();
    } catch (e) {
      setStatus(`Stopped after ${sent}: ${e.message}`);
    }

    setSending(false);
  };

  const ready =
    title.trim() &&
    body.trim() &&
    (target !== "picked" || picked.length > 0) &&
    (target === "picked" || counts[target] > 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div>
        <label className="block text-sm font-semibold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={PUSH_TITLE_MAX}
          placeholder="MyLyfe just launched 🎉"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
        />

        <label className="mt-5 block text-sm font-semibold">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={PUSH_BODY_MAX}
          rows={3}
          placeholder="Head to the App Store and update to the new version."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <p className="mt-1 text-xs text-gray-400">
          {body.length}/{PUSH_BODY_MAX}. Tapping opens the app — old builds
          can&rsquo;t deep-link to the App Store, so say where to go.
        </p>

        <label className="mt-5 block text-sm font-semibold">Send to</label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
        >
          {Object.entries(audiences).map(([value, label]) => (
            <option key={value} value={value}>
              {label} ({counts[value] ?? 0})
            </option>
          ))}
          <option value="picked">Specific people…</option>
        </select>

        {target === "picked" && (
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              autoComplete="off"
            />

            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-gray-100 border border-gray-200 rounded-md">
                {results.map((u) => {
                  const on = picked.some((p) => p.id === u.id);
                  return (
                    <li key={u.id}>
                      <button
                        onClick={() => toggle(u)}
                        disabled={!u.hasToken}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm disabled:opacity-40"
                      >
                        <span>
                          <span className="font-medium">
                            {u.username || "(no username)"}
                          </span>
                          {u.name && (
                            <span className="text-gray-400"> · {u.name}</span>
                          )}
                          {u.is_developer && (
                            <span className="text-gray-400"> · dev</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {!u.hasToken ? "no device" : on ? "selected" : "add"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {picked.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Sending to {picked.map((p) => p.username || p.id).join(", ")}.{" "}
                <button
                  onClick={() => setPicked([])}
                  className="underline decoration-gray-300"
                >
                  clear
                </button>
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <button
            disabled={!ready || sending}
            onClick={send}
            className="rounded-md bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send push"}
          </button>
        </div>

        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Preview</h2>
        <div className="mt-2 rounded-xl bg-gray-100 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            MyLyfe &middot; now
          </p>
          <p className="mt-1 break-words text-sm font-semibold">
            {title || "Title"}
          </p>
          <p className="break-words text-sm text-gray-600">
            {body || "Message"}
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Only devices that granted notification permission and have a saved
          token are counted. Tokens Expo reports as dead are cleared as we go.
        </p>
      </div>
    </div>
  );
}
