/**
 * Server-side fetch of the approved video wall.
 *
 * Deliberately swallows every failure and returns an empty list. The collage is
 * decoration; the marketing homepage is the product. If App Runner is down, or
 * slow, or the env var is unset in a preview deploy, the page must still render
 * a perfectly good hero — it just renders it without cards.
 */

const API_BASE = (process.env.NEXT_PUBLIC_MYLYFE_API_BASE || "").replace(/\/$/, "");

export async function fetchWallVideos(limit = 32) {
  if (!API_BASE) return [];

  try {
    const res = await fetch(`${API_BASE}/api/waitlist/videos?limit=${limit}`, {
      // Matches `export const revalidate = 300` on the homepage and the
      // 5-minute shuffle bucket the API uses, so the order is stable for
      // exactly as long as the page that renders it is.
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.videos) ? data.videos : [];
  } catch (error) {
    console.error("[wall] video fetch failed:", error.message);
    return [];
  }
}
