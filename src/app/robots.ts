import type { MetadataRoute } from "next";
import { indexingAllowed, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    // Local, CI and development previews must never be crawled.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Account areas and placeholder pages are not useful in search results.
        disallow: ["/api/", "/*/login", "/*/register", "/*/favorites", "/*/post-ad"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
