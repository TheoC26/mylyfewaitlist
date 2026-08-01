"use client";

import Image from "next/image";
import { useLaunchState } from "@/lib/useLaunchState";
import FloatingCollage from "./FloatingCollage";
import Countdown from "./Countdown";
import WaitlistForm from "./WaitlistForm";
import LaunchCTA from "./LaunchCTA";

/**
 * The homepage hero.
 *
 * Occupies a full viewport on its own (min-h-svh), so the drifting collage has
 * the whole screen to move through and the footer sits genuinely below the
 * fold rather than cropping the animation. svh rather than vh for the same
 * reason the collage keyframes use it: vh changes as the mobile URL bar shows
 * and hides, which would resize the section mid-scroll.
 *
 * @param {{ videos: Array, serverLaunched: boolean }} props
 *   `serverLaunched` is hasLaunched() as evaluated during SSR. It seeds the
 *   client state so hydration cannot mismatch — see useLaunchState.
 */
export default function Hero({ videos = [], serverLaunched = false }) {
  const { launched, parts } = useLaunchState(serverLaunched);
  const hasCollage = videos.length > 0;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white">
      <FloatingCollage videos={videos} />

      {/* ── Scrim ────────────────────────────────────────────────────────────
          Two layers, both non-interactive so they never swallow a click on the
          email field. The first dissolves the collage into the page at top and
          bottom; the second is a soft pool of white behind the copy column
          only, which is what keeps the gray subcopy readable over moving
          footage without flattening the whole background to solid white. */}
      {hasCollage && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,white_0%,rgba(255,255,255,0.55)_18%,rgba(255,255,255,0.55)_72%,white_100%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_60%_at_50%_38%,white_0%,rgba(255,255,255,0.94)_45%,transparent_100%)] lg:bg-[radial-gradient(60%_55%_at_28%_45%,white_0%,rgba(255,255,255,0.92)_45%,transparent_100%)]"
          />
        </>
      )}

      {/* Pinned to the top centre, above both scrim layers, and deliberately
          outside the copy column — it belongs to the whole page rather than to
          the paragraph it used to sit under. */}
      {!launched && (
        <div className="relative z-20 flex justify-center pt-4 sm:pt-6">
          <Countdown parts={parts} />
        </div>
      )}

      {/* flex-1 + items-center vertically centres the copy in whatever height
          is left once the countdown has taken its share. */}
      <div className="relative z-10 flex flex-1 items-center py-6">
        <div className="mx-auto w-full max-w-6xl lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
            <div className="mx-auto max-w-md px-4 text-center mt-0 lg:-mt-12 sm:max-w-2xl sm:px-6 lg:px-0 lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-black sm:text-6xl xl:text-6xl">
                <span className="block text-white font-outline-2">
                  Introducing{" "}
                </span>
                <span className="block text-black">MyLyfe</span>
              </h1>

              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                {launched
                  ? "The new wave of social media starts here. It's live. Go get it."
                  : "The new wave of social media starts here. Join our waitlist to be one of the first to try it out."}
              </p>

              <div className="mt-10 sm:mt-12">
                {launched ? <LaunchCTA /> : <WaitlistForm />}
              </div>
            </div>

            {/* The product mockup competes with the collage for the same
                viewport, so it steps aside on mobile once there are videos to
                show and only returns at lg where there is room for both. */}
            <div className={hasCollage ? "hidden" : "mt-12 lg:hidden"}>
              <Image
                src="/productMockup.png"
                alt="Product preview"
                width={600}
                height={600}
                className="mx-auto h-auto w-72 sm:w-80"
                priority
              />
            </div>
            <div className="mt-12 hidden w-full items-center justify-center lg:mt-0 lg:flex">
              <Image
                className="mx-auto w-4/7"
                width={1000}
                height={1000}
                src="/productMockup.png"
                alt="Product preview"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
