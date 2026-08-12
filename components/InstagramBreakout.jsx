"use client";

import { useEffect } from "react";
import { APP_STORE_URL } from "@/lib/launch";

/**
 * `itms-apps://` is the same App Store listing, addressed by a non-http(s)
 * scheme. That distinction is the whole trick: Instagram's in-app browser
 * intercepts https:// navigations itself and keeps them on-screen inside its
 * own WebView, but a scheme it doesn't recognize gets handed to iOS, which
 * pops the native "Open in App Store?" prompt — outside Instagram's control
 * because it's the OS handling it, not the WebView.
 */
const ITMS_APP_STORE_URL = APP_STORE_URL.replace(
  "https://apps.apple.com",
  "itms-apps://apps.apple.com",
);

/** Same idea for Android: hand the URL to Chrome by name via an intent, since
 *  Instagram's WebView will happily keep rendering a plain https:// link
 *  itself. There is no live Android app yet, so this mostly future-proofs the
 *  page for when APP_STORE_URL becomes a smart link that also handles Android
 *  — today it just lands on Apple's own "not available" page in real Chrome,
 *  which is still an improvement over being stuck inside Instagram. */
function androidIntentUrl(url) {
  const { host, pathname, search } = new URL(url);
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
}

/**
 * Shown only when app/download/page.jsx has already detected an Instagram
 * user agent server-side. Everyone else gets a plain server redirect and never
 * renders this component.
 *
 * The auto-attempt on mount is a best effort, not a guarantee — Instagram has
 * tightened what it lets a WebView escape to before, and there is no signal
 * that tells us whether it worked. So the visible button underneath is not a
 * "just in case" afterthought, it's the reliable path: a real tap on a plain
 * https:// anchor is the one thing that consistently breaks out, because it
 * carries a genuine user gesture rather than a scripted one.
 */
export default function InstagramBreakout() {
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    window.location.href = isAndroid
      ? androidIntentUrl(APP_STORE_URL)
      : ITMS_APP_STORE_URL;
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-white px-6 text-center">
      <p className="max-w-xs text-sm text-gray-500">
        Instagram&rsquo;s browser blocks the App Store from opening
        automatically. Tap below to continue.
      </p>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-black px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      >
        Open the App Store
      </a>
    </main>
  );
}
