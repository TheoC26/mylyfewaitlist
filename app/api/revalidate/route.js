import { revalidatePath, revalidateTag } from 'next/cache';
import { WALL_VIDEOS_TAG } from '@/lib/wall';
import { assertAdmin } from '@/lib/adminAuth';

/**
 * Push a freshly-moderated video to the live homepage immediately.
 *
 * The homepage is ISR with a 5-minute window, and the fetch inside it has its
 * own 5-minute window, so without this an approval could take ten minutes to
 * show up. Worse, no amount of reloading helps: the stale copy lives on
 * Vercel's edge, not in the browser, so the obvious debugging move looks like
 * the feature is broken.
 *
 * BOTH calls are needed. revalidateTag drops the cached API response;
 * revalidatePath drops the rendered page that embedded it. Doing only the
 * second rebuilds the page around the same stale video list.
 *
 * Gated by CRON_SECRET, the same value the admin page already holds — this can
 * force cache regeneration, which is worth a little rate-limiting of its own if
 * it were ever public. The gate itself lives in lib/adminAuth.js so this route
 * and the analytics route cannot drift apart.
 */
export async function POST(req) {
  const denied = assertAdmin(req);
  if (denied) return denied;

  revalidateTag(WALL_VIDEOS_TAG);
  revalidatePath('/');

  return Response.json({ ok: true, revalidated: ['/', WALL_VIDEOS_TAG] });
}
