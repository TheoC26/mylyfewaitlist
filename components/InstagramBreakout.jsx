"use client";

import { useEffect, useRef } from "react";
import { APP_STORE_URL } from "@/lib/launch";
import { runEscapeLadder } from "@/lib/escapeInAppBrowser";

/**
 * Shown only when app/download/page.jsx has already detected an Instagram user
 * agent server-side. Everyone else gets a plain server redirect and never
 * renders this.
 *
 * The shape of this page follows directly from what is actually true about
 * Instagram's WebView in 2026: every automatic escape is best-effort and Meta
 * keeps closing them, while the ⋯ menu works every time. So the automatic
 * attempt on mount is the optimistic path, the button re-runs the same ladder
 * with a genuine tap behind it (explicit gestures get through where scripted
 * navigations are swallowed), and the ⋯ instruction is always visible rather
 * than being revealed only after a failure — because there is no reliable
 * signal that tells us a failure happened.
 */
export default function InstagramBreakout() {
  const cancelRef = useRef(null);

  useEffect(() => {
    // navigateOnExhaust stays false here: if the automatic attempts fail we
    // must leave this page up, because it is the only thing telling the user
    // about the ⋯ menu.
    cancelRef.current = runEscapeLadder(APP_STORE_URL);
    return () => cancelRef.current?.();
  }, []);

  const handleTap = (event) => {
    // The anchor's own href is the ladder's last resort, so let the ladder
    // drive rather than navigating immediately underneath it.
    event.preventDefault();
    cancelRef.current?.();
    cancelRef.current = runEscapeLadder(APP_STORE_URL, {
      navigateOnExhaust: true,
    });
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <div>
        <h1 className="text-lg font-semibold text-black">Get MyLyfe</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">
          Instagram&rsquo;s browser can&rsquo;t open the App Store directly.
        </p>
      </div>

      <a
        href={APP_STORE_URL}
        onClick={handleTap}
        className="rounded-md bg-black px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      >
        Open the App Store
      </a>

      {/* The guaranteed path, and the only one that is not at Meta's mercy.
          Deliberately not hidden behind an "if that didn't work" disclosure:
          nothing tells us whether the attempts above succeeded, so the
          instruction has to be readable before the user needs it. */}
      <p className="mx-auto max-w-xs text-xs leading-relaxed text-gray-400">
        Still stuck? Tap{" "}
        <span aria-hidden="true" className="font-semibold text-gray-500">
          &#8943;
        </span>
        <span className="sr-only">the three dots menu</span> at the top right,
        then <span className="text-gray-500">Open in external browser</span>.
      </p>
    </main>
  );
}
