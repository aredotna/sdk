import { describe, expect, it } from "vitest";
import {
  generatePKCE,
  OAuth,
  OAuthStateMismatchError,
  OAuthTokenExchangeError,
  parseOAuthCallback,
} from "../src/oauth";

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
    ).rejects.toBeInstanceOf(OAuthStateMismatchError);
  });

  it("throws typed token exchange errors with provider payloads", async () => {
    const oauth = new OAuth({
      clientId: "client",
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "The authorization code is invalid.",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 400,
          },
        ),
      redirectUri: "https://example.com/callback",
    });

    await expect(oauth.exchangeCode({ code: "code" })).rejects.toMatchObject({
      message: "The authorization code is invalid.",
      payload: {
        error: "invalid_grant",
        error_description: "The authorization code is invalid.",
      },
      status: 400,
    });
    await expect(oauth.exchangeCode({ code: "code" })).rejects.toBeInstanceOf(
      OAuthTokenExchangeError,
    );
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

  it("does not bind custom fetch implementations", async () => {
    const oauth = new OAuth({
      clientId: "client",
      fetch: function (this: unknown) {
        expect(this).toBeUndefined();

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
      } as typeof fetch,
      redirectUri: "https://example.com/callback",
    });

    await expect(oauth.exchangeCode({ code: "code" })).resolves.toMatchObject({
      access_token: "token",
      token_type: "Bearer",
    });
  });

  it("parses successful OAuth callback URLs", () => {
    expect(parseOAuthCallback("https://example.com/callback?code=code&state=state")).toEqual({
      code: "code",
      ok: true,
      state: "state",
    });
    expect(parseOAuthCallback("https://example.com/callback?code=code")).toEqual({
      code: "code",
      ok: true,
      state: undefined,
    });
  });

  it("parses provider errors and missing callback codes", () => {
    expect(
      parseOAuthCallback(
        "https://example.com/callback?error=access_denied&error_description=Denied&state=state",
      ),
    ).toEqual({
      error: "access_denied",
      errorDescription: "Denied",
      ok: false,
      state: "state",
    });
    expect(parseOAuthCallback("https://example.com/callback?state=state")).toEqual({
      error: "missing_code",
      errorDescription: "OAuth callback URL did not include an authorization code.",
      ok: false,
      state: "state",
    });
  });

  it("generates PKCE verifier/challenge pairs", async () => {
    const pkce = await generatePKCE();

    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
    expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
