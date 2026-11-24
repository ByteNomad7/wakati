import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext Cloudflare configuration (see docs/CLOUDFLARE.md).
 *
 * - Incremental cache: R2 behind the Cache API regional cache. It serves the
 *   prerendered static pages (legal, placeholders, auth confirmation).
 * - Queue: Durable Object queue for time-based revalidation. No route currently uses
 *   time-based revalidation (live-data pages render per request), so it is idle; it
 *   stays configured so the existing Durable Object binding and migration remain valid.
 * - Tag cache: none (no tag-based invalidation is used).
 * - Cache Components is disabled in next.config.ts; it failed on deployed Workers.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
});
