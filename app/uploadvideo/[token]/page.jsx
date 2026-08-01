"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import VideoTrimmer from "@/components/VideoTrimmer";
import { CONSENT_TEXT_V1, CONSENT_VERSION } from "@/lib/consent";

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || "").replace(
  /\/$/,
  "",
);

/**
 * The per-person video upload page.
 *
 * Reached only from the tokenized link in the welcome email (or straight from
 * the signup success state). The token in the URL is the whole credential —
 * there is no account and nothing to log into, which is exactly why the link
 * still works tomorrow, on a different device, which is where people actually
 * have their videos.
 */
export default function UploadVideoPage() {
  const { token } = useParams();

  const [state, setState] = useState({ status: "loading" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/waitlist/upload/${token}`);
      if (res.status === 404) return setState({ status: "invalid" });
      if (!res.ok) return setState({ status: "error" });
      setState({ status: "ready", data: await res.json() });
    } catch {
      setState({ status: "error" });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Two-step upload: the browser PUTs the raw file straight to S3 with a
   * presigned URL, then tells the server where it landed. The bytes never pass
   * through App Runner, which is what makes a 60MB phone clip viable.
   */
  const handleUpload = async ({ file, startSec, endSec }) => {
    setError("");
    setBusy(true);
    setProgress(0);

    try {
      const presignRes = await fetch(
        `${API_BASE}/api/waitlist/upload/${token}/presign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type || "video/mp4",
            sizeBytes: file.size,
          }),
        },
      );

      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(
          {
            unsupported_type:
              "That file type isn't supported. Try an MP4 or a video straight from your camera roll.",
            too_large:
              "That file is too large. Try a shorter clip or a lower resolution.",
            already_submitted: "You've already submitted a video.",
            not_eligible: "The video wall is full.",
          }[body.error] || "Couldn't start the upload. Please try again.",
        );
      }

      const { uploadUrl, rawKey } = await presignRes.json();

      // XHR rather than fetch: xhr.upload.onprogress is the only way to get a
      // real progress bar, and a progress bar is what stops someone abandoning
      // a 60MB upload halfway through.
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        // Must match the Content-Type that was signed exactly, or S3 rejects
        // the signature with an opaque error.
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(
                new Error(
                  xhr.status === 403
                    ? "This upload link was rejected. It may have expired — reload the page and try again."
                    : `Upload failed (${xhr.status})`,
                ),
              );
        // onerror means the request never completed at the network layer, so
        // there is no status to report. For a cross-origin PUT that is almost
        // always the S3 bucket's CORS rules rejecting the preflight, NOT the
        // user's connection — so log the real cause for us while showing them
        // something honest and non-blaming.
        xhr.onerror = () => {
          console.error(
            `[upload] PUT to S3 failed before any response. Usually CORS: the ` +
              `mylyfe-videos bucket must allow PUT from origin "${window.location.origin}". ` +
              `Check the bucket's CORS configuration in the S3 console.`,
          );
          reject(
            new Error(
              "The upload couldn't reach our storage. Please try again in a moment.",
            ),
          );
        };
        xhr.send(file);
      });

      setProgress(100);

      const finalizeRes = await fetch(
        `${API_BASE}/api/waitlist/upload/${token}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawKey,
            startSec,
            endSec,
            consent: true,
            consentVersion: CONSENT_VERSION,
          }),
        },
      );

      if (!finalizeRes.ok) {
        const body = await finalizeRes.json().catch(() => ({}));
        throw new Error(
          {
            invalid_window: "That clip needs to be between 1 and 5 seconds.",
            unreadable_video:
              "We couldn't read that video. Try a different file.",
            consent_required: "Please tick the box so we can use your video.",
          }[body.error] || "We couldn't process that video. Please try again.",
        );
      }

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* No w-full here: combined with mx-4 that is 100% + 32px, which
            overflows the viewport and gives the whole page a horizontal
            scrollbar. flex + justify-center already centers it. */}
        <div className="mt-4 mb-12 flex items-center justify-center">
          <Link href="/" className="text-center text-xl font-bold">
            MyLyfe
          </Link>
        </div>

        <div className="mx-auto max-w-xl px-4 pb-24 sm:px-6">
          <Body
            state={state}
            consent={consent}
            setConsent={setConsent}
            busy={busy}
            progress={progress}
            error={error}
            onUpload={handleUpload}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

function Body({ state, consent, setConsent, busy, progress, error, onUpload }) {
  if (state.status === "loading") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-64 w-full rounded bg-gray-100" />
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <Message title="This link isn't valid.">
        Double-check the link in your email, or{" "}
        <Link href="/" className="underline">
          head back home
        </Link>
        .
      </Message>
    );
  }

  if (state.status === "error") {
    return (
      <Message title="Something went wrong.">
        We couldn&apos;t load your spot just now. Refresh the page in a moment.
      </Message>
    );
  }

  const { position, eligible, cap, video, email } = state.data;
  const ordinal = `#${Number(position).toLocaleString("en-US")}`;

  if (!eligible) {
    return (
      <Message title={`You're ${ordinal} on the list.`}>
        The homepage video wall was capped at the first{" "}
        {Number(cap).toLocaleString("en-US")} signups, so that one&apos;s closed
        — but your spot in line is safe, and we&apos;ll email you the moment we
        launch.
      </Message>
    );
  }

  if (video && video.status === "pending") {
    return (
      <>
        <Message title="Got it! you're in review.">
          We look at every video before it goes up, so give us a day.
          You&apos;ll see it on the homepage once it&apos;s approved.
        </Message>
        <ClipPreview video={video} />
      </>
    );
  }

  if (video && video.status === "approved") {
    return (
      <>
        <Message title="You're on the wall.">
          Your clip is live on{" "}
          <Link href="/" className="underline">
            the homepage
          </Link>
          . Thanks for being part of this.
        </Message>
        <ClipPreview video={video} />
      </>
    );
  }

  // Everything below is the upload form: either a first submission, or a
  // replacement after a rejection.
  return (
    <>
      {video?.status === "rejected" && (
        <div className="mb-8 rounded-md border border-gray-200 p-4">
          <p className="text-sm font-semibold text-black">
            We couldn&apos;t use that one.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {video.moderationNote ||
              "Have another go — something authentic works best."}
          </p>
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
        You&apos;re {ordinal}. Put yourself on the homepage.
      </h1>

      <p className="mt-4 text-base text-gray-500">
        Send us{" "}
        <strong className="font-semibold text-black">1 to 5 seconds</strong> of
        something authentic — you and your friends, a party, a walk home, even
        just dinner. Nothing staged. It goes up alongside everyone else&apos;s.
      </p>

      <p className="mt-2 text-sm text-gray-400">Signed in as {email}</p>

      <div className="mt-10">
        <VideoTrimmer
          maxBytes={209715200}
          disabled={!consent}
          busy={busy}
          progress={progress}
          onUpload={onUpload}
        />
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-black"
        />
        <span className="text-sm text-gray-500">{CONSENT_TEXT_V1}</span>
      </label>

      {!consent && (
        <p className="mt-2 text-sm text-gray-400">
          Tick the box above to enable the upload.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </>
  );
}

function Message({ title, children }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base text-gray-500">{children}</p>
    </div>
  );
}

function ClipPreview({ video }) {
  return (
    <div className="mt-8 w-full max-w-[220px] overflow-hidden rounded-xl bg-gray-100">
      <video
        src={video.videoUrl}
        poster={video.posterUrl}
        muted
        loop
        autoPlay
        playsInline
        className="block h-auto w-full"
      />
    </div>
  );
}
