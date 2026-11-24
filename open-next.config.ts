import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext Cloudflare configuration (see docs/CLOUDFLARE.md).
 *
 * - Incremental cache: R2 only. It serves the prerendered static pages (legal,
 *   placeholders, auth confirmation). The Cache API "regional cache" wrapper was
 *   removed: the Cache API is not available to Workers fronted by Cloudflare Access
 *   (our previews), and its per-request cache write measured about 5 ms of CPU on
 *   static pages, half of the Workers Free 10 ms budget.
 * - Queue: Durable Object queue for time-based revalidation. No route currently uses
 *   time-based revalidation (live-data pages render per request), so it is idle; it
 *   stays configured so the existing Durable Object binding and migration remain valid.
 * - Tag cache: none (no tag-based invalidation is used).
 * - Cache Components is disabled in next.config.ts; it failed on deployed Workers.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
