import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APP_STORE_URL } from "@/lib/launch";
import InstagramBreakout from "@/components/InstagramBreakout";

/**
 * The link every "Download" button on the site points at, instead of the App
 * Store URL directly — so this one place is the only thing that needs to know
 * about Instagram's in-app browser, rather than every call site.
 *
 * Detection happens server-side, off the request's own User-Agent header,
 * because it lets the common case (a normal browser) redirect with a plain
 * HTTP 307 before any client JS runs — no flash of an intermediate page, and
 * it still works with JS disabled. Only the Instagram case needs a client
 * component at all, because escaping the in-app browser means touching
 * `window.location`.
 */
export default async function DownloadPage() {
  const ua = (await headers()).get("user-agent") || "";
  const isInstagram = /Instagram/i.test(ua);

  if (!isInstagram) {
    redirect(APP_STORE_URL);
  }

  return <InstagramBreakout />;
}
