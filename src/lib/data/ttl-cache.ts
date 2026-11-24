/**
 * Small in-memory cache with a time-to-live, used for reference data.
 *
 * Why not the Next.js data cache? On Cloudflare Workers (OpenNext adapter) Next's
 * Cache Components / composable caching caused HTTP 500s and missing sections on
 * deployed Workers (see docs/CLOUDFLARE.md). Reference data is tiny and changes
 * rarely, so a per-instance cache keeps it fast without depending on the adapter's
 * cache machinery. Each Worker isolate (or Node process) holds its own copy.
 *
 * - Concurrent callers share one in-flight load (no thundering herd).
 * - Failed loads are not cached; the next caller retries.
 * - Entries are never served past their TTL (no stale data beyond the TTL).
 */
export interface TtlCache<T> {
  get(): Promise<T>;
  invalidate(): void;
}

export function createTtlCache<T>(
  load: () => Promise<T>,
  ttlMs: number,
  now: () => number = Date.now,
): TtlCache<T> {
  let value: { data: T; expiresAt: number } | null = null;
  let inflight: Promise<T> | null = null;

  return {
    async get() {
      if (value && now() < value.expiresAt) return value.data;
      if (inflight) return inflight;
      inflight = load()
        .then((data) => {
          value = { data, expiresAt: now() + ttlMs };
          return data;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    invalidate() {
      value = null;
    },
  };
}
