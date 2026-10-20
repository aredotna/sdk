import { afterEach, describe, expect, it, vi } from "vitest";
import { ArenaRateLimitError, createArena } from "../src";
import { createClientWithState } from "../src/client";
import {
  createRateLimitFetch,
  type MutableRateLimit,
  parseRateLimitHeaders,
} from "../src/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rate limit handling", () => {
  it("binds the default global fetch", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = function (this: typeof globalThis) {
      expect(this).toBe(globalThis);
      return Promise.resolve(new Response(JSON.stringify({ ok: true })));
    } as typeof fetch;

    try {
      const { client } = createClientWithState();

      await client.get({
        url: "/v3/ping",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not bind injected fetch implementations", async () => {
    const { client } = createClientWithState({
      fetch: function (this: unknown) {
        expect(this).toBeUndefined();
        return Promise.resolve(new Response(JSON.stringify({ ok: true })));
      } as typeof fetch,
    });

    await client.get({
      url: "/v3/ping",
    });
  });

  it("records rate-limit headers on responses", async () => {
    const { client, rateLimit } = createClientWithState({
      fetch: async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "120",
            "X-RateLimit-Reset": "1893456000",
            "X-RateLimit-Tier": "free",
            "X-RateLimit-Window": "60",
            "X-RateLimit-Bucket": "write-minute",
            "X-RateLimit-Cost": "5",
            "X-RateLimit-Policy": "120;w=60, 300;w=3600",
            "X-RateLimit-Remaining": "0",
          },
        }),
    });

    await client.get({
      url: "/v3/ping",
    });

    expect(rateLimit.current).toMatchObject({
      limit: 120,
      tier: "free",
      window: 60,
      bucket: "write-minute",
      cost: 5,
      policy: "120;w=60, 300;w=3600",
      remaining: 0,
    });
    expect(rateLimit.current?.reset?.getUTCFullYear()).toBe(2030);
  });

  it("recognizes partial rate-limit metadata and ignores invalid numbers", () => {
    expect(parseRateLimitHeaders(new Headers({ "X-RateLimit-Remaining": "0" }))).toMatchObject({
      remaining: 0,
    });
    expect(
      parseRateLimitHeaders(
        new Headers({ "X-RateLimit-Cost": "invalid", "X-RateLimit-Reset": "1e100" }),
      ),
    ).toBeUndefined();
  });

  it.each([
    "reset",
    "retry-seconds",
    "retry-date",
    "body",
  ])("waits for %s timing and replays a consumed mutation body", async (timing) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
    const headers: Record<string, string> = {};
    if (timing === "reset") headers["X-RateLimit-Reset"] = String(Date.now() / 1000 + 2);
    if (timing === "retry-seconds") headers["Retry-After"] = "2";
    if (timing === "retry-date") headers["Retry-After"] = new Date(Date.now() + 2000).toUTCString();
    const bodies: unknown[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      bodies.push(await new Request(input).json());
      return bodies.length === 1
        ? rateLimitResponse(headers, timing === "body" ? 2 : 100)
        : new Response("ok");
    });
    const fetch = createRateLimitFetch({
      fetchImpl,
      rateLimit: { current: undefined },
      retry: { respectRateLimits: true },
    });
    const response = fetch(
      new Request("https://api.are.na/v3/groups/studio/members/42", {
        body: JSON.stringify({ role: "admin" }),
        method: "PATCH",
      }),
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await response).status).toBe(200);
    expect(bodies).toEqual([{ role: "admin" }, { role: "admin" }]);
  });

  it("cancels an hourly backoff without making another request", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => rateLimitResponse({ "Retry-After": "3600" }));
    const fetch = createRateLimitFetch({
      fetchImpl,
      rateLimit: { current: undefined },
      retry: { respectRateLimits: true },
    });
    const pending = fetch(new Request("https://api.are.na/v3/ping", { signal: controller.signal }));
    const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);

    controller.abort();

    await rejected;
    expect(vi.getTimerCount()).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not send a request with an already-aborted signal", async () => {
    const fetchImpl = vi.fn();
    const fetch = createRateLimitFetch({ fetchImpl, rateLimit: { current: undefined } });
    await expect(
      fetch("https://api.are.na/v3/ping", { signal: AbortSignal.abort() }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    { respectRateLimits: true, maxRetries: 2 },
  ])("honors retry settings %j", async (retry) => {
    const fetchImpl = vi.fn(async () => rateLimitResponse({ "Retry-After": "0" }));
    const fetch = createRateLimitFetch({ fetchImpl, rateLimit: { current: undefined }, retry });
    const response = await fetch("https://api.are.na/v3/ping");
    expect(response.status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(retry ? 3 : 1);
    expect(await response.json()).toMatchObject({ error: { type: "rate_limit_exceeded" } });
  });

  it("uses the rejected response's timing instead of another request's cached reset", async () => {
    vi.useFakeTimers();
    const rateLimit: MutableRateLimit = { current: { reset: new Date(Date.now() + 3600000) } };
    let attempts = 0;
    const fetch = createRateLimitFetch({
      fetchImpl: async () => (++attempts === 1 ? rateLimitResponse({}, 2) : new Response("ok")),
      rateLimit,
      retry: { respectRateLimits: true },
    });
    const pending = fetch("https://api.are.na/v3/ping");
    await vi.advanceTimersByTimeAsync(2000);
    expect((await pending).status).toBe(200);
    expect(attempts).toBe(2);
  });

  it("preserves nested rate-limit errors and their retry timing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
    const arena = createArena({ fetch: async () => rateLimitResponse({}, 1800) });

    await expect(arena.ping()).rejects.toBeInstanceOf(ArenaRateLimitError);
    await expect(arena.ping()).rejects.toMatchObject({
      message: "Write budget exhausted",
      error: "rate_limit_exceeded",
      status: 429,
      retryAfter: new Date("2026-10-20T12:30:00Z"),
      details: {
        current_status: { detailed_limits: { free: { write_hour: 300 } } },
        retry_after: 1800,
      },
    });
  });

  it("prefers Retry-After over reset and body timing on normalized errors", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
    const arena = createArena({
      fetch: async () =>
        rateLimitResponse(
          {
            "Retry-After": "37",
            "X-RateLimit-Reset": String(Date.now() / 1000 + 100),
            "X-RateLimit-Bucket": "write-hour",
            "X-RateLimit-Remaining": "0",
          },
          1800,
        ),
    });
    await expect(arena.ping()).rejects.toMatchObject({
      retryAfter: new Date("2026-10-20T12:00:37Z"),
      rateLimit: { bucket: "write-hour", remaining: 0 },
    });
  });

  it("does not attach another response's rate-limit metadata to an error", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
    let attempts = 0;
    const arena = createArena({
      fetch: async () =>
        ++attempts === 1
          ? new Response("{}", {
              headers: { "X-RateLimit-Reset": String(Date.now() / 1000 + 3600) },
            })
          : rateLimitResponse({}, 2),
    });
    await arena.ping();
    await expect(arena.ping()).rejects.toMatchObject({
      rateLimit: undefined,
      retryAfter: new Date("2026-10-20T12:00:02Z"),
    });
  });
});

const rateLimitResponse = (headers: Record<string, string> = {}, retryAfter = 37) =>
  new Response(
    JSON.stringify({
      error: {
        type: "rate_limit_exceeded",
        message: "Write budget exhausted",
        tier: "free",
        limit: 300,
        limit_window: "1 hour",
        retry_after: retryAfter,
        current_status: { detailed_limits: { free: { write_hour: 300 } } },
        suggestions: [],
      },
    }),
    {
      status: 429,
      statusText: "Too Many Requests",
      headers: { "Content-Type": "application/json", ...headers },
    },
  );
