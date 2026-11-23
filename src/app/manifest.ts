import type { MetadataRoute } from "next";
import { brandColors } from "@/lib/brand/tokens";

/**
 * Web app manifest (installable PWA groundwork). Icons are resampled from the
 * official 1024px app icon. No offline mode or native features are claimed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wakati – Buy • Sell • Find Locally",
    short_name: "Wakati",
    description: "Classifieds marketplace for Cameroon.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: brandColors.canvas,
    theme_color: brandColors.navy,
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/wakati-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/wakati-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/wakati-app-icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
    ],
  };
}
