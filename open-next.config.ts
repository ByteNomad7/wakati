import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext Cloudflare configuration (see docs/CLOUDFLARE.md).
 *
 * - Incremental cache: R2 (read/write, supports revalidation) behind the Cache API
 *   regional cache so most reads never reach R2.
 * - Queue: Durable Object queue for background time-based revalidation
 *   (`cacheLife("minutes")` on listing sections).
 * - Tag cache: none yet. Phase B adds a D1 tag cache together with the first
 *   `updateTag("listings")` call; until then tag invalidation is not used.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
});
