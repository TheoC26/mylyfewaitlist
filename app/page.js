import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { fetchWallVideos } from "@/lib/wall";
import { hasLaunched } from "@/lib/launch";

/**
 * Server component, on purpose. Converting this from 'use client' buys three
 * things at once:
 *
 *  1. The collage videos are in the initial HTML — no client-side waterfall and
 *     no layout shift as cards pop in.
 *  2. The shuffle is decided on the server, so there is nothing for hydration
 *     to disagree about.
 *  3. Because `revalidate` re-runs this function, hasLaunched() is re-evaluated
 *     periodically — which means the CACHED page self-corrects into launched
 *     mode within five minutes of the launch instant, with no redeploy. The
 *     client hook flips it instantly for anyone already looking at the tab;
 *     this covers everyone arriving fresh from the CDN.
 */
export const revalidate = 300;

export default async function Home() {
  // 60 is the API's own ceiling, and far more than the 14 cards the collage can
  // show at once. The surplus is the Reload button's ammunition: it re-deals
  // from this pool client-side, which is the only thing that CAN work — the
  // server shuffles on a 5-minute seed, so refetching inside that window returns
  // the identical list. Cost is a few hundred bytes of URLs in the payload;
  // nothing extra is downloaded until a card actually points at it.
  const videos = await fetchWallVideos(60);

  return (
    <>
      <main className="bg-white">
        <Hero videos={videos} serverLaunched={hasLaunched()} />
      </main>
      <Footer />
    </>
  );
}
