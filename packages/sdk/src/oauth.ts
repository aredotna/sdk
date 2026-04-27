import pkceChallenge from "pkce-challenge";

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

export type OAuthCallbackResult =
  | {
      code: string;
      ok: true;
      state?: string;
    }
  | {
      error: string;
      errorDescription?: string;
      ok: false;
      state?: string;
    };

export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class OAuthStateMismatchError extends OAuthError {
  readonly expectedState?: string;
  readonly state?: string;

  constructor(options: { expectedState?: string; state?: string }) {
    super("OAuth state mismatch.");
    this.expectedState = options.expectedState;
    this.state = options.state;
  }
}

export class OAuthMissingCodeError extends OAuthError {
  constructor() {
    super("OAuth callback URL did not include an authorization code.");
  }
}

export class OAuthProviderError extends OAuthError {
  readonly error: string;
  readonly errorDescription?: string;
  readonly state?: string;

  constructor(result: Extract<OAuthCallbackResult, { ok: false }>) {
    super(result.errorDescription ?? result.error);
    this.error = result.error;
    this.errorDescription = result.errorDescription;
    this.state = result.state;
  }
}

export class OAuthTokenExchangeError extends OAuthError {
  readonly payload: unknown;
  readonly response: Response;
  readonly status: number;

  constructor(response: Response, payload: unknown) {
    super(tokenExchangeMessage(response, payload));
    this.payload = payload;
    this.response = response;
    this.status = response.status;
  }
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
      throw new OAuthStateMismatchError({
        expectedState: options.expectedState,
        state: options.state,
      });
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

    const fetchImpl = this.fetchImpl;
    const response = await fetchImpl(new URL("/v3/oauth/token", this.apiBaseUrl), {
      body: form,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new OAuthTokenExchangeError(response, payload);
    }

    return payload as OAuthTokenResponse;
  }
}

export const generatePKCE = async (): Promise<PKCEPair> => {
  const pair = await pkceChallenge();
  return {
    codeChallenge: pair.code_challenge,
    codeVerifier: pair.code_verifier,
  };
};

export const generateState = (bytes = 32) =>
  base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));

export const parseOAuthCallback = (url: string | URL): OAuthCallbackResult => {
  const parsed = parseUrl(url);
  if (!parsed) {
    return {
      error: "invalid_callback_url",
      errorDescription: "OAuth callback URL could not be parsed.",
      ok: false,
    };
  }

  const state = parsed.searchParams.get("state") ?? undefined;
  const error = parsed.searchParams.get("error");

  if (error) {
    return {
      error,
      errorDescription: parsed.searchParams.get("error_description") ?? undefined,
      ok: false,
      state,
    };
  }

  const code = parsed.searchParams.get("code");
  if (!code) {
    return {
      error: "missing_code",
      errorDescription: "OAuth callback URL did not include an authorization code.",
      ok: false,
      state,
    };
  }

  return {
    code,
    ok: true,
    state,
  };
};

const readJson = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const tokenExchangeMessage = (response: Response, payload: unknown) => {
  if (payload && typeof payload === "object") {
    const description = (payload as Record<string, unknown>).error_description;
    if (typeof description === "string") {
      return description;
    }

    const error = (payload as Record<string, unknown>).error;
    if (typeof error === "string") {
      return `OAuth token exchange failed: ${error}`;
    }
  }

  return `OAuth token exchange failed with status ${response.status}.`;
};

const parseUrl = (url: string | URL) => {
  try {
    if (url instanceof URL) {
      return url;
    }

    return new URL(url);
  } catch {
    return undefined;
  }
};

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
