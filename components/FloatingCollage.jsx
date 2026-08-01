"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The stream of tilted cards drifting up behind the hero — the waitlist video
 * wall.
 *
 * Ported from the app's React Native FloatingCollage. The RN version drives
 * everything through Reanimated shared values; on the web all of it is plain
 * CSS keyframes, and the port is genuinely SIMPLER than the original rather
 * than a workaround. The RN source's own comment says `phase` "stands in for a
 * negative animation delay" — on the web it does not stand in for one, it IS
 * one, so the withTiming-then-withRepeat handoff and the cancelAnimation
 * cleanup both disappear. No animation library is needed and none should be
 * added.
 *
 * The keyframes themselves live in app/globals.css (.ml-rise / .ml-sway) —
 * they have to be real CSS rules so that `prefers-reduced-motion` can override
 * them, which inline styles cannot do.
 */

/** Per-card layout/timing. Ported verbatim from the RN CARD_TABLE — it is
 *  already tuned for a phone-width viewport. */
const MOBILE_CARDS = [
  { left: 6, width: 184, height: 236, rot: -6, riseDur: 20, swayDur: 4.2, phase: 0 },
  { left: 62, width: 168, height: 216, rot: 5, riseDur: 23, swayDur: 5.0, phase: 0.13 },
  { left: 32, width: 156, height: 200, rot: -4, riseDur: 21, swayDur: 4.6, phase: 0.3 },
  { left: -2, width: 192, height: 252, rot: 7, riseDur: 25, swayDur: 5.4, phase: 0.48 },
  { left: 70, width: 180, height: 232, rot: -7, riseDur: 20, swayDur: 4.8, phase: 0.61 },
  { left: 40, width: 164, height: 208, rot: 4, riseDur: 22, swayDur: 5.2, phase: 0.09 },
  { left: 16, width: 172, height: 224, rot: 6, riseDur: 24, swayDur: 4.4, phase: 0.74 },
  { left: 58, width: 160, height: 200, rot: -5, riseDur: 21, swayDur: 5.6, phase: 0.43 },
];

/** Desktop is much wider than a phone, so the RN table would leave the middle
 *  of the screen empty. Same rot/duration/phase ranges, spread across the
 *  viewport and slightly smaller so more of them fit without crowding. */
const DESKTOP_CARDS = [
  { left: -2, width: 170, height: 220, rot: -5, riseDur: 22, swayDur: 4.6, phase: 0.05 },
  { left: 8, width: 152, height: 196, rot: 6, riseDur: 25, swayDur: 5.2, phase: 0.52 },
  { left: 17, width: 186, height: 240, rot: -7, riseDur: 20, swayDur: 4.2, phase: 0.28 },
  { left: 27, width: 160, height: 208, rot: 4, riseDur: 24, swayDur: 5.6, phase: 0.71 },
  { left: 36, width: 176, height: 228, rot: -4, riseDur: 21, swayDur: 4.8, phase: 0.14 },
  { left: 46, width: 150, height: 194, rot: 7, riseDur: 26, swayDur: 5.0, phase: 0.63 },
  { left: 55, width: 192, height: 248, rot: -6, riseDur: 23, swayDur: 4.4, phase: 0.37 },
  { left: 65, width: 164, height: 212, rot: 5, riseDur: 20, swayDur: 5.4, phase: 0.85 },
  { left: 74, width: 178, height: 230, rot: -5, riseDur: 25, swayDur: 4.6, phase: 0.21 },
  { left: 83, width: 156, height: 202, rot: 6, riseDur: 22, swayDur: 5.2, phase: 0.58 },
  { left: 88, width: 186, height: 240, rot: -7, riseDur: 24, swayDur: 4.9, phase: 0.44 },
  { left: 2, width: 158, height: 204, rot: 5, riseDur: 26, swayDur: 5.5, phase: 0.79 },
  { left: 31, width: 148, height: 192, rot: -6, riseDur: 23, swayDur: 4.3, phase: 0.92 },
  { left: 60, width: 154, height: 200, rot: 4, riseDur: 21, swayDur: 5.1, phase: 0.67 },
];

/**
 * How many cards may hold a live <video> at once.
 *
 * Browsers cap simultaneously-decoding videos, and iOS Safari's ceiling is the
 * tight one — past it, videos silently refuse to play, and in Low Power Mode
 * autoplay is blocked outright. Rather than fight that, every card always
 * paints its poster image and only a handful are promoted to real video.
 */
const VIDEO_BUDGET = { mobile: 6, desktop: 10 };

export default function FloatingCollage({ videos = [], className = "" }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [playable, setPlayable] = useState(() => new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef(null);

  // Default to the mobile table for SSR and swap after mount, so the server and
  // the first client render always agree.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setIsDesktop(wide.matches);
      setReducedMotion(motion.matches);
    };
    sync();

    wide.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    // `resize` as well as the media-query listener, deliberately. The MQL
    // change event is the correct signal but it is not universally dependable
    // — it does not fire under devtools/CDP viewport emulation, and a tablet
    // rotating across the 1024px boundary is a real case where being wrong
    // means rendering the 14-card desktop table into a phone-width column.
    // `resize` always fires, and sync() is idempotent, so listening to both
    // costs nothing.
    window.addEventListener("resize", sync);
    return () => {
      wide.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const table = isDesktop ? DESKTOP_CARDS : MOBILE_CARDS;
  const budget = isDesktop ? VIDEO_BUDGET.desktop : VIDEO_BUDGET.mobile;

  const cards = videos.length
    ? table.map((card, i) => ({ ...card, video: videos[i % videos.length], index: i }))
    : [];

  /**
   * Promote cards that are on screen, demote the ones that leave, and never
   * exceed the budget. Demoting unmounts the <video> entirely, which is what
   * actually frees the decoder — pausing alone does not.
   */
  useEffect(() => {
    if (reducedMotion || !cards.length || !containerRef.current) {
      setPlayable(new Set());
      return;
    }

    const nodes = containerRef.current.querySelectorAll("[data-card-index]");
    if (!nodes.length) return;

    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number(entry.target.dataset.cardIndex);
          if (entry.isIntersecting) visible.add(index);
          else visible.delete(index);
        }
        // Deterministic slice, so cards do not flicker in and out of playback
        // as the set is re-ordered.
        setPlayable(new Set([...visible].sort((a, b) => a - b).slice(0, budget)));
      },
      { rootMargin: "10% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [cards.length, budget, reducedMotion]);

  // Nothing approved yet: render nothing at all. A grid of grey placeholder
  // cards on the marketing homepage reads as broken, not as anticipation.
  if (!cards.length) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {cards.map((card) => (
        <div
          key={card.index}
          data-card-index={card.index}
          className="ml-rise"
          style={{
            "--left": `${card.left}%`,
            "--w": `${card.width}px`,
            "--h": `${card.height}px`,
            "--rot": `${card.rot}deg`,
            "--rise-dur": `${card.riseDur}s`,
            "--sway-dur": `${card.swayDur}s`,
            "--phase": card.phase,
          }}
        >
          <div className="ml-sway">
            {/* The poster is ALWAYS painted, underneath. That single decision is
                what makes every failure mode invisible: blocked autoplay, a
                decode failure, a demoted card, or a browser that has simply run
                out of decoders all degrade to a still frame instead of a black
                rectangle. */}
            <img
              src={card.video.posterUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {playable.has(card.index) && (
              <CardVideo src={card.video.videoUrl} poster={card.video.posterUrl} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Fades in over the poster once it can actually play, so a slow or failed load
 * never blanks the card.
 *
 * The retry loop is not belt-and-braces, it is load-bearing. Chrome actively
 * pauses muted, audio-less video it considers backgrounded ("video-only
 * background media was paused to save power") — and every clip here is
 * audio-less, because cutWallClip strips the audio track. iOS Low Power Mode
 * refuses autoplay outright. Without a retry, one tab-switch leaves the wall
 * frozen on stills for the rest of the visit.
 *
 * Every play() rejection is swallowed on purpose: the poster is already
 * painted underneath, so a refusal is invisible rather than broken, and there
 * is nothing useful to tell the user about it.
 */
function CardVideo({ src, poster }) {
  const [ready, setReady] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Gated on visibility, deliberately. Retrying unconditionally would fight
    // the very intervention we are recovering from — the browser pauses, we
    // play, it pauses again — which burns CPU in a tab nobody is looking at.
    // Only a visible tab is worth restarting.
    const tryPlay = () => {
      if (document.visibilityState === "visible" && el.paused) {
        el.play().catch(() => {});
      }
    };

    tryPlay();
    // `pause` covers the browser's own power-saving intervention;
    // visibilitychange covers coming back to a backgrounded tab.
    el.addEventListener("pause", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);
    return () => {
      el.removeEventListener("pause", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      autoPlay
      playsInline
      preload="metadata"
      onCanPlay={() => setReady(true)}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
      style={{ opacity: ready ? 1 : 0 }}
    />
  );
}
