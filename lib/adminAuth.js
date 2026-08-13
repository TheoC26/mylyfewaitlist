/**
 * Shared secret gate for the admin-only route handlers.
 *
 * Lifted out of app/api/revalidate/route.js so the revalidate and analytics
 * routes cannot drift apart. Same CRON_SECRET the admin page already holds in
 * sessionStorage and sends as x-cron-secret — never in the URL, where it would
 * land in history, referrers and server logs.
 *
 * Returns a Response to bail with, or null to proceed.
 */
export function assertAdmin(req) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[admin] CRON_SECRET is not set on this deployment.");
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const provided = req.headers.get("x-cron-secret") ?? "";
  // Length check first: a plain !== would leak timing, and comparing unequal
  // lengths is the case worth short-circuiting anyway.
  if (provided.length !== secret.length || provided !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}
