/**
 * The disallowed paths are all capability URLs or internal tools — the token in
 * the path IS the credential, so an indexed one is a leaked one.
 */
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/uploadvideo/", "/unsubscribe/", "/admin", "/profile/"],
    },
    sitemap: "https://mylyfeapp.com/sitemap.xml",
  };
}
