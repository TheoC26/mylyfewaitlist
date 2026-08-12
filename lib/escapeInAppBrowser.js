/**
 * Getting out of Instagram's in-app browser.
 *
 * Worth stating plainly, because it shapes everything below: as of 2026 there
 * is NO automatic escape that reliably works. Meta has closed each one in turn,
 * and a plain https://apps.apple.com link inside the WebView is frequently a
 * dead tap rather than an App Store launch. So this module is a ladder of cheap
 * best-efforts, and the UI that calls it always keeps the manual
 * "⋯ → Open in external browser" instruction on screen as the real floor.
 *
 * Each rung is here for a specific researched reason:
 *
 *  1. instagram://extbrowser/?url= — Instagram's own hand-off to the system
 *     browser. Reports genuinely conflict on whether this still works; it is
 *     undocumented and Meta has narrowed it before. It's first because when it
 *     does work it is the cleanest exit (no scheme prompt, no Chrome
 *     dependency), and it costs nothing when it doesn't.
 *
 *  2a. iOS — x-safari-https:// via window.open, NOT location.href. That
 *      distinction is the whole rung: real-device testing (shalanah's
 *      inapp-debugger) finds this scheme escapes Instagram's iOS WebView only
 *      when opened through window.open. Assigning location.href — which is
 *      what the previous version of this page did — is silently swallowed.
 *
 *  2b. Android — an intent:// URL naming Chrome explicitly. Instagram's
 *      Android WebView renders plain https:// itself, but hands an
 *      unrecognised intent to the OS.
 *
 * @see https://github.com/shalanah/inapp-debugger
 * @see https://www.flyn.to/blog/instagram-in-app-browser
 */

/** Instagram's in-app WebView identifies itself in the UA string. */
export function isInstagramBrowser(ua = "") {
  return /Instagram/i.test(ua);
}

export function isAndroid(ua = "") {
  return /Android/i.test(ua);
}

/**
 * The ordered list of escape attempts for this platform.
 *
 * Returned as thunks rather than run inline so the caller controls pacing —
 * they have to be spaced out, since each one may raise an OS-level prompt and
 * firing them back-to-back would stack dialogs on top of each other.
 *
 * @param {string} url  the https:// destination
 * @param {string} ua   navigator.userAgent
 * @returns {Array<() => void>}
 */
export function escapeAttempts(url, ua) {
  const bare = url.replace(/^https:\/\//, "");
  const steps = [
    () => {
      window.location.href = `instagram://extbrowser/?url=${encodeURIComponent(url)}`;
    },
  ];

  if (isAndroid(ua)) {
    const { host, pathname, search } = new URL(url);
    steps.push(() => {
      window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
    });
  } else {
    // window.open is load-bearing here — see the header comment.
    steps.push(() => {
      window.open(`x-safari-https://${bare}`, "_blank");
    });
  }

  return steps;
}

/**
 * Walk the ladder.
 *
 * Bails the moment the page is backgrounded, because that IS the success
 * signal: if the OS has switched to Safari or the App Store we are hidden, and
 * continuing to fire schemes would queue up prompts that ambush the user when
 * they come back.
 *
 * `navigateOnExhaust` decides what happens when every rung has failed, and the
 * two callers genuinely want opposite things:
 *
 *  - On mount (false) we must STAY PUT. A plain https://apps.apple.com
 *    navigation inside Instagram's WebView is frequently a dead tap, so
 *    navigating on exhaust would replace the page that explains the ⋯ menu
 *    with a blank failure — stranding the user with no way forward and no
 *    explanation. Silently staying put keeps the instructions on screen.
 *  - On an explicit tap (true) the user has asked to go somewhere, so falling
 *    through to the real URL is the honest last resort.
 *
 * @param {string} url
 * @param {{ stepMs?: number, navigateOnExhaust?: boolean }} [options]
 * @returns {() => void} cancel
 */
export function runEscapeLadder(
  url,
  { stepMs = 800, navigateOnExhaust = false } = {},
) {
  const steps = escapeAttempts(url, navigator.userAgent);
  let index = 0;
  let timer = null;
  let cancelled = false;

  const stop = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onHide);
  };

  function onHide() {
    if (document.hidden) stop();
  }
  document.addEventListener("visibilitychange", onHide);

  const fire = () => {
    if (cancelled || document.hidden) return stop();

    if (index >= steps.length) {
      // Everything clever has failed. Whether that means "navigate anyway" or
      // "leave the page alone" is the caller's call — see navigateOnExhaust.
      if (navigateOnExhaust) window.location.href = url;
      return stop();
    }

    steps[index++]();
    timer = setTimeout(fire, stepMs);
  };

  fire();
  return stop;
}
