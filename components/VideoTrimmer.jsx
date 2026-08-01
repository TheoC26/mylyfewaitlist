"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pick a video, choose a 1-5 second window, upload it.
 *
 * The hard part is not the UI, it is that browsers disagree wildly about what
 * they can decode. The single most common file here is an iPhone .MOV, and
 * desktop Chrome and Firefox cannot decode HEVC at all — the <video> element
 * loads, reports no dimensions, and shows nothing. So this component has two
 * modes:
 *
 *   preview mode — the real thing: scrubbable filmstrip, live seek, looping
 *                  playback of the selection.
 *   blind mode   — no preview possible, so we show a single "start at" slider
 *                  over the known duration and say plainly that the result will
 *                  appear after processing.
 *
 * Blind mode is not a degraded afterthought. The server re-encodes every upload
 * with ffmpeg regardless, so a blind-mode trim produces exactly the same output
 * as a previewed one; the only thing lost is seeing it beforehand.
 */

const MIN_SEC = 1;
const MAX_SEC = 5;
const DEFAULT_SEC = 3;

const fmt = (s) => `${s.toFixed(1)}s`;

export default function VideoTrimmer({ maxBytes, onUpload, disabled, busy, progress }) {
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [blind, setBlind] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(DEFAULT_SEC);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const seekTimer = useRef(null);

  // Revoke the object URL when it is replaced or the component goes away —
  // these pin the whole file in memory, and a 200MB video is worth freeing.
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const pickFile = (e) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;

    setError("");
    // Check size BEFORE anything else. Discovering a file is too big after a
    // ten-minute upload is the worst possible time to find out.
    if (maxBytes && chosen.size > maxBytes) {
      setError(
        `That file is ${(chosen.size / 1048576).toFixed(0)}MB — the limit is ${Math.round(maxBytes / 1048576)}MB. Try a shorter clip, or one at a lower resolution.`,
      );
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setFile(chosen);
    setObjectUrl(URL.createObjectURL(chosen));
    setDuration(0);
    setBlind(false);
    setStart(0);
    setEnd(DEFAULT_SEC);
  };

  const onLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    // iOS Safari reports Infinity for some fragmented sources until a seek has
    // happened. Nudging currentTime forces it to resolve a real duration.
    if (!Number.isFinite(el.duration)) {
      el.currentTime = 1e6;
      return;
    }

    const secs = el.duration;
    if (!(secs > 0)) {
      setBlind(true);
      return;
    }

    setDuration(secs);
    // videoWidth of 0 with a valid duration is the HEVC-on-desktop signature:
    // the container parsed, the video stream did not.
    if (!el.videoWidth) setBlind(true);

    const span = Math.min(DEFAULT_SEC, Math.max(MIN_SEC, secs));
    setStart(0);
    setEnd(Math.min(span, secs));
  }, []);

  const onDurationChange = useCallback(() => {
    const el = videoRef.current;
    if (el && Number.isFinite(el.duration) && el.duration > 0 && !duration) {
      setDuration(el.duration);
      el.currentTime = 0;
    }
  }, [duration]);

  /** Seeks are debounced — scrubbing a 4K file re-decodes on every move. */
  const seek = useCallback((t) => {
    if (blind) return;
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      const el = videoRef.current;
      if (el) el.currentTime = t;
    }, 80);
  }, [blind]);

  // Loop playback within the selected window, so what you hear/see is exactly
  // what will be cut.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || blind) return;
    const onTime = () => {
      if (el.currentTime >= end || el.currentTime < start - 0.1) {
        el.currentTime = start;
      }
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [start, end, blind]);

  // ── Drag handling for the two handles and the window body ────────────────
  const posFromEvent = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const onPointerDown = (mode) => (e) => {
    if (!duration || blind) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, originX: e.clientX, startAt: start, endAt: end };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || !duration) return;

    const at = posFromEvent(e.clientX);

    if (drag.mode === "start") {
      const next = Math.min(Math.max(0, at), drag.endAt - MIN_SEC);
      setStart(next);
      // Dragging the in-point must not let the window exceed the max.
      if (drag.endAt - next > MAX_SEC) setEnd(next + MAX_SEC);
      seek(next);
    } else if (drag.mode === "end") {
      const next = Math.max(Math.min(duration, at), drag.startAt + MIN_SEC);
      setEnd(next);
      if (next - drag.startAt > MAX_SEC) setStart(next - MAX_SEC);
      seek(Math.max(0, next - 0.3));
    } else {
      const span = drag.endAt - drag.startAt;
      const delta = at - posFromEvent(drag.originX);
      const nextStart = Math.min(Math.max(0, drag.startAt + delta), duration - span);
      setStart(nextStart);
      setEnd(nextStart + span);
      seek(nextStart);
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    const el = videoRef.current;
    if (el && !blind) {
      el.currentTime = start;
      el.play().catch(() => {});
    }
  };

  const span = end - start;
  const canSubmit =
    file && duration > 0 && span >= MIN_SEC - 0.01 && span <= MAX_SEC + 0.01 && !disabled;

  if (!file) {
    return (
      <div>
        <label className="block cursor-pointer rounded-md border-2 border-dashed border-gray-300 px-6 py-12 text-center transition-colors hover:border-black">
          <input type="file" accept="video/*" className="sr-only" onChange={pickFile} />
          <span className="block text-base font-semibold text-black">Choose a video</span>
          <span className="mt-1 block text-sm text-gray-400">
            You&apos;ll pick the 1&ndash;5 seconds to use next
          </span>
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-xl bg-gray-100">
        <video
          ref={videoRef}
          src={objectUrl}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={onDurationChange}
          onError={() => setBlind(true)}
          className="block h-auto w-full"
          style={{ aspectRatio: "9 / 16", objectFit: "cover" }}
        />
        {blind && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">
              This browser can&apos;t preview this file&apos;s format, but the upload will
              still work — we&apos;ll show you the result once it&apos;s processed.
            </p>
          </div>
        )}
      </div>

      {duration > 0 && (
        <div className="mt-6">
          {blind ? (
            <>
              <label htmlFor="startAt" className="block text-sm text-gray-500">
                Start at <span className="font-semibold text-black">{fmt(start)}</span> — using{" "}
                {fmt(span)}
              </label>
              <input
                id="startAt"
                type="range"
                min={0}
                max={Math.max(0, duration - MIN_SEC)}
                step={0.1}
                value={start}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setStart(next);
                  setEnd(Math.min(duration, next + Math.min(DEFAULT_SEC, duration - next)));
                }}
                className="mt-2 w-full accent-black"
              />
              <label htmlFor="lenAt" className="mt-4 block text-sm text-gray-500">
                Length
              </label>
              <input
                id="lenAt"
                type="range"
                min={MIN_SEC}
                max={MAX_SEC}
                step={0.1}
                value={span}
                onChange={(e) => setEnd(Math.min(duration, start + Number(e.target.value)))}
                className="mt-2 w-full accent-black"
              />
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-gray-500">Drag to pick your moment</span>
                <span className="font-semibold tabular-nums text-black">{fmt(span)}</span>
              </div>

              <div
                ref={trackRef}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="relative mt-3 h-12 w-full touch-none rounded-md bg-gray-100 select-none"
              >
                <div
                  onPointerDown={onPointerDown("window")}
                  className="absolute inset-y-0 cursor-grab rounded-md border-2 border-black bg-black/5 active:cursor-grabbing"
                  style={{
                    left: `${(start / duration) * 100}%`,
                    width: `${(span / duration) * 100}%`,
                  }}
                >
                  <span
                    onPointerDown={onPointerDown("start")}
                    className="absolute top-1/2 -left-1.5 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm bg-black"
                  />
                  <span
                    onPointerDown={onPointerDown("end")}
                    className="absolute top-1/2 -right-1.5 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm bg-black"
                  />
                </div>
              </div>
              <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-400">
                <span>0s</span>
                <span>{fmt(duration)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={() => onUpload({ file, startSec: start, endSec: end })}
          className="rounded-md bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? `Uploading ${progress}%` : "Upload my video"}
        </button>
        <label className="cursor-pointer text-sm text-gray-500 underline">
          <input type="file" accept="video/*" className="sr-only" onChange={pickFile} />
          Pick a different video
        </label>
      </div>

      {busy && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-black transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
