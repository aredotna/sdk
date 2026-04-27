import { createArenaError } from "./errors";
import {
  type Client,
  type Config,
  createClient as createGeneratedClient,
} from "./generated/client";
import type { RawClientOptions } from "./options";
import { resolveAuthToken } from "./options";
import { createRateLimitFetch, type MutableRateLimit } from "./rate-limit";

export type ArenaClient = Client;

export interface ClientWithState {
  client: ArenaClient;
  rateLimit: MutableRateLimit;
}

export const createClient = (options: RawClientOptions = {}): ArenaClient => {
  return createClientWithState(options).client;
};

export const createClientWithState = (options: RawClientOptions = {}): ClientWithState => {
  const rateLimit: MutableRateLimit = { current: undefined };
  const headers = new Headers(options.headers);

  if (options.userAgent) {
    headers.set("User-Agent", options.userAgent);
  }

  const config: Config = {
    auth: (auth) => resolveAuthToken(options.token, auth),
    baseUrl: options.baseUrl ?? "https://api.are.na",
    fetch: createRateLimitFetch({
      fetchImpl: options.fetch,
      rateLimit,
      retry: options.retry,
    }),
    headers,
    responseStyle: "fields",
    throwOnError: options.throwOnError ?? false,
  };

  const client = createGeneratedClient(config);

  if (options.normalizeErrors) {
    client.interceptors.error.use((error, response, request) =>
      createArenaError({
        cause: error,
        error,
        rateLimit: rateLimit.current,
        request,
        response,
      }),
    );
  }

  return { client, rateLimit };
};
