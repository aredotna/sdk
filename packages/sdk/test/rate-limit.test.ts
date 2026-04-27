import { describe, expect, it } from "vitest";
import { createClientWithState } from "../src/client";

describe("rate limit handling", () => {
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
