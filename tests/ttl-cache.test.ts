import { describe, expect, it, vi } from "vitest";
import { createTtlCache } from "@/lib/data/ttl-cache";

describe("TTL cache for reference data", () => {
  it("serves the cached value until the TTL expires, then reloads", async () => {
    let t = 0;
    const load = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");
    const cache = createTtlCache(load, 1000, () => t);
    expect(await cache.get()).toBe("v1");
    t = 999;
    expect(await cache.get()).toBe("v1");
    t = 1000; // expired exactly at the TTL: never served past it
    expect(await cache.get()).toBe("v2");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight load between concurrent callers", async () => {
    let resolve!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const cache = createTtlCache(load, 1000, () => 0);
    const a = cache.get();
    const b = cache.get();
    resolve("shared");
    expect(await Promise.all([a, b])).toEqual(["shared", "shared"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not cache failures", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce("ok");
    const cache = createTtlCache(load, 1000, () => 0);
    await expect(cache.get()).rejects.toThrow("db down");
    expect(await cache.get()).toBe("ok");
  });

  it("can be invalidated explicitly", async () => {
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");
    const cache = createTtlCache(load, 60_000, () => 0);
    expect(await cache.get()).toBe("old");
    cache.invalidate();
    expect(await cache.get()).toBe("new");
  });
});
