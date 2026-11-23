import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
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
