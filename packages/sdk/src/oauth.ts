export type OAuthScope = "read" | "write" | `${"read" | "write"} ${"read" | "write"}`;

export interface OAuthOptions {
  apiBaseUrl?: string;
  authorizationBaseUrl?: string;
  clientId: string;
  fetch?: typeof fetch;
  redirectUri: string;
}

export interface AuthorizeUrlOptions {
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  scope?: OAuthScope;
  state?: string;
}

export interface ExchangeCodeOptions {
  clientSecret?: string;
  code: string;
  codeVerifier?: string;
  expectedState?: string;
  redirectUri?: string;
  state?: string;
}

export interface ClientCredentialsOptions {
  clientSecret: string;
  scope?: OAuthScope;
}

export interface OAuthTokenResponse {
  access_token: string;
  created_at: number;
  scope: string;
  token_type: "Bearer";
}

export interface PKCEPair {
  codeChallenge: string;
  codeVerifier: string;
}

export class OAuth {
  private readonly apiBaseUrl: string;
  private readonly authorizationBaseUrl: string;
  private readonly clientId: string;
  private readonly fetchImpl: typeof fetch;
  private readonly redirectUri: string;

  constructor(options: OAuthOptions) {
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.are.na";
    this.authorizationBaseUrl = options.authorizationBaseUrl ?? "https://www.are.na";
    this.clientId = options.clientId;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.redirectUri = options.redirectUri;
  }

  authorizeUrl(options: AuthorizeUrlOptions = {}) {
    const url = new URL("/oauth/authorize", this.authorizationBaseUrl);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", options.scope ?? "read");

    if (options.state) {
      url.searchParams.set("state", options.state);
    }

    if (options.codeChallenge) {
      url.searchParams.set("code_challenge", options.codeChallenge);
      url.searchParams.set("code_challenge_method", options.codeChallengeMethod ?? "S256");
    }

    return url.toString();
  }

  async exchangeCode(options: ExchangeCodeOptions) {
    if (
      options.expectedState !== undefined &&
      options.state !== undefined &&
      options.state !== options.expectedState
    ) {
      throw new Error("OAuth state mismatch.");
    }

    return this.token({
      client_id: this.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      code_verifier: options.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: options.redirectUri ?? this.redirectUri,
    });
  }

  clientCredentials(options: ClientCredentialsOptions) {
    return this.token({
      client_id: this.clientId,
      client_secret: options.clientSecret,
      grant_type: "client_credentials",
      scope: options.scope,
    });
  }

  private async token(body: Record<string, string | undefined>) {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        form.set(key, value);
      }
    }

    const response = await this.fetchImpl(new URL("/v3/oauth/token", this.apiBaseUrl), {
      body: form,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof payload?.error_description === "string"
          ? payload.error_description
          : `OAuth token exchange failed with status ${response.status}.`,
      );
    }

    return payload as OAuthTokenResponse;
  }
}

export const generatePKCE = async (): Promise<PKCEPair> => {
  const codeVerifier = randomVerifier();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return {
    codeChallenge: base64UrlEncode(new Uint8Array(digest)),
    codeVerifier,
  };
};

export const generateState = (bytes = 32) =>
  base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));

const randomVerifier = () => generateState(64);

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
