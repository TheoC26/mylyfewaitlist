"use client";

import { useEffect, useState } from "react";
import { hasLaunched, remainingParts } from "./launch";

/**
 * Ticks the countdown and flips the page to launched mode, without ever
 * producing a hydration mismatch.
 *
 * Three separate things make that work, and each one is load-bearing:
 *
 * 1. `launched` is SEEDED from a server-computed prop rather than from
 *    Date.now(). React's first client render therefore emits exactly what the
 *    server emitted; the effect below corrects it a moment later. This is also
 *    what lets the server independently flip the page (the homepage revalidates
 *    every 5 minutes, so a cached pre-launch HTML self-corrects) without the
 *    two halves ever disagreeing during the overlap.
 *
 * 2. `parts` starts null, so the countdown renders placeholders during SSR and
 *    hydration and real digits only after mount. The server and the client
 *    cannot disagree about a number that neither of them has rendered.
 *
 * 3. The ?preview= override is read from window.location inside the effect
 *    rather than via useSearchParams. useSearchParams in a client component
 *    forces the whole page under a Suspense boundary or fails the static build
 *    outright ("missing-suspense-with-csr-bailout"); reading window.location
 *    costs nothing here because we are already mount-gated.
 *
 * @param {boolean} serverLaunched  hasLaunched() as evaluated during SSR
 */
export function useLaunchState(serverLaunched) {
  const [launched, setLaunched] = useState(serverLaunched);
  const [parts, setParts] = useState(null);

  useEffect(() => {
    // ?preview=launched / ?preview=waitlist — for checking both states without
    // waiting for (or faking) the real date.
    const preview = new URLSearchParams(window.location.search).get("preview");
    const forced =
      preview === "launched" ? true : preview === "waitlist" ? false : null;

    const tick = () => {
      const now = Date.now();
      setLaunched(forced ?? hasLaunched(now));
      setParts(remainingParts(now));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { launched, parts, mounted: parts !== null };
}
