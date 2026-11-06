import type { MetadataRoute } from "next";

const SITE = "https://www.kkhobor.com";

/** Search engines may read the stories and study pages; private and admin pages are left out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/desk", "/api", "/saved", "/brand"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
