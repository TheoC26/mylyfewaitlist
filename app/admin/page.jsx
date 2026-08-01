"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || "").replace(
  /\/$/,
  "",
);

/**
 * Internal tool. Two jobs: approve or reject the videos people upload, and send
 * an email to the waitlist.
 *
 * The moderation half is not a nicety. Nothing in this stack does automated
 * content checking, so every uploaded video sits at status='pending' until a
 * human looks at it — which means the only thing standing between an arbitrary
 * upload and the public homepage is somebody working through this queue. Doing
 * that over curl for several hundred clips is hours of work; this pays for
 * itself immediately.
 *
 * Auth is the CRON_SECRET, typed in and held in sessionStorage — never in the
 * URL, where it would end up in history, referrers and server logs. It is
 * deliberately plain: this is a page for one person, not a product surface.
 */
export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("moderate");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("mylyfe_admin_secret");
    if (saved) {
      setSecret(saved);
      setAuthed(true);
    }
  }, []);

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API_BASE}/api/waitlist/admin${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": secret,
          ...(options.headers || {}),
        },
      });
      if (res.status === 401) throw new Error("Wrong secret.");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },
    [secret],
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
      <div className="mx-auto max-w-5xl">
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
          {["moderate", "broadcast"].map((t) => (
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
          {tab === "moderate" ? (
            <Moderate api={api} secret={secret} onChange={loadStats} />
          ) : (
            <Broadcast api={api} />
          )}
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

function Broadcast({ api }) {
  const [subject, setSubject] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory((await api("/broadcasts")).broadcasts);
    } catch {
      /* non-critical */
    }
  }, [api]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
   * Sent in chunks, in a loop, because a full send takes longer than App Runner
   * will hold one request open. The server dedupes on (broadcast_id, signup_id),
   * so resuming — or a double-click — cannot send anyone two copies.
   */
  const sendReal = async () => {
    if (
      !window.confirm(
        `Send "${subject}" to: ${AUDIENCES.find((a) => a.value === audience).label}?`,
      )
    ) {
      return;
    }

    setSending(true);
    let broadcastId;
    let sent = 0;
    let failed = 0;

    try {
      for (;;) {
        const r = await api("/broadcast", {
          method: "POST",
          body: JSON.stringify({ ...payload(), broadcastId }),
        });
        broadcastId = r.broadcastId;
        sent += r.sent;
        failed += r.failed;
        setStatus(
          `Sent ${sent} of ${r.total}${failed ? ` (${failed} failed)` : ""}…`,
        );
        if (r.remaining === 0) break;
      }
      setStatus(`Done — ${sent} sent${failed ? `, ${failed} failed` : ""}.`);
      loadHistory();
    } catch (e) {
      setStatus(
        `Stopped: ${e.message}. Re-send to resume — nobody gets a duplicate.`,
      );
    }
    setSending(false);
  };

  const ready = subject.trim() && bodyMd.trim();

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div>
        <label className="block text-sm font-semibold">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
        />

        <label className="mt-5 block text-sm font-semibold">Body</label>
        <p className="text-xs text-gray-400">Blank lines become paragraphs.</p>
        <textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={10}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold">Button label</label>
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="optional"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Button link</label>
            <input
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="https://…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold">Audience</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
