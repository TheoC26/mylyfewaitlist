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
  const videos = await fetchWallVideos();

  return (
    <>
      <main className="bg-white">
        <Hero videos={videos} serverLaunched={hasLaunched()} />
      </main>
      <Footer />
    </>
  );
}
