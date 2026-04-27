import { describe, expect, it } from "vitest";
import { generatePKCE, OAuth } from "../src/oauth";

describe("OAuth", () => {
  it("builds authorization URLs with PKCE and state", () => {
    const oauth = new OAuth({
      clientId: "client",
      redirectUri: "https://example.com/callback",
    });

    const url = new URL(
      oauth.authorizeUrl({
        codeChallenge: "challenge",
        scope: "write",
        state: "state",
      }),
    );

    expect(url.origin).toBe("https://www.are.na");
    expect(url.searchParams.get("client_id")).toBe("client");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("state");
  });

  it("rejects mismatched state before token exchange", async () => {
    const oauth = new OAuth({
      clientId: "client",
      fetch: async () => {
        throw new Error("should not fetch");
      },
      redirectUri: "https://example.com/callback",
    });

    await expect(
      oauth.exchangeCode({
        code: "code",
        expectedState: "expected",
        state: "actual",
      }),
    ).rejects.toThrow("OAuth state mismatch");
  });

  it("binds the default global fetch for browser compatibility", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = function (this: typeof globalThis) {
      expect(this).toBe(globalThis);

      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            created_at: 1,
            scope: "write",
            token_type: "Bearer",
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    } as typeof fetch;

    try {
      const oauth = new OAuth({
        clientId: "client",
        redirectUri: "https://example.com/callback",
      });

      await expect(oauth.exchangeCode({ code: "code" })).resolves.toMatchObject({
        access_token: "token",
        token_type: "Bearer",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("generates PKCE verifier/challenge pairs", async () => {
    const pkce = await generatePKCE();

    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
