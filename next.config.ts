import type { NextConfig } from "next";

/** Allow optimised images from the project's Supabase Storage (public buckets only). */
function supabaseImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

// Anything that is not an explicit production deployment is kept out of search engines.
const indexingAllowed = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === "production";

const securityHeaders = [
  ...(indexingAllowed ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Cache Components is intentionally OFF: on Cloudflare Workers (OpenNext) it caused
  // HTTP 500s and missing streamed sections on deployed Workers. See docs/CLOUDFLARE.md.
  poweredByHeader: false,
  images: {
    // Modern formats keep pages light on mobile connections.
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseImagePatterns(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
