import type { Auth, AuthToken } from "./generated/core/auth.gen";

export type TokenProvider = string | (() => AuthToken | Promise<AuthToken>);

export interface RetryOptions {
  maxRetries?: number;
  respectRateLimits?: boolean;
}

export interface ArenaOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  headers?: HeadersInit;
  retry?: RetryOptions;
  token?: TokenProvider;
  userAgent?: string;
}

export type RawClientOptions = ArenaOptions & {
  normalizeErrors?: boolean;
  throwOnError?: boolean;
};

export const resolveAuthToken = async (token: TokenProvider | undefined, auth: Auth) => {
  if (!token) {
    return undefined;
  }

  const value = typeof token === "function" ? await token() : token;
  if (!value) {
    return undefined;
  }

  if (auth.scheme === "bearer" && value.startsWith("Bearer ")) {
    return value.slice("Bearer ".length);
  }

  return value;
};
