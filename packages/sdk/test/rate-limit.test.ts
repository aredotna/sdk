import { describe, expect, it } from "vitest";
import { createClientWithState } from "../src/client";

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
    });
    expect(rateLimit.current?.reset?.getUTCFullYear()).toBe(2030);
  });
});
