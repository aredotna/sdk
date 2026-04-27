import type { RetryOptions } from "./options";

export interface RateLimitInfo {
  limit?: number;
  reset?: Date;
  tier?: string;
  window?: number;
}

export interface MutableRateLimit {
  current: RateLimitInfo | undefined;
}

export const parseRateLimitHeaders = (headers: Headers): RateLimitInfo | undefined => {
  const limit = parseNumber(headers.get("X-RateLimit-Limit"));
  const reset = parseUnixDate(headers.get("X-RateLimit-Reset"));
  const tier = headers.get("X-RateLimit-Tier") ?? undefined;
  const window = parseNumber(headers.get("X-RateLimit-Window"));

  if (limit === undefined && reset === undefined && tier === undefined && window === undefined) {
    return undefined;
  }

  return { limit, reset, tier, window };
};

export const retryDelayFromRateLimit = (rateLimit: RateLimitInfo | undefined) => {
  if (!rateLimit?.reset) {
    return 0;
  }

  return Math.max(0, rateLimit.reset.getTime() - Date.now());
};

export const createRateLimitFetch = ({
  fetchImpl = globalThis.fetch,
  rateLimit,
  retry,
}: {
  fetchImpl?: typeof fetch;
  rateLimit: MutableRateLimit;
  retry?: RetryOptions;
}): typeof fetch => {
  const maxRetries = retry?.maxRetries ?? 1;
  const respectRateLimits = retry?.respectRateLimits ?? false;

  return async (input, init) => {
    const retryableInput = cloneRequestInput(input);
    let response = await fetchImpl(input, init);
    rateLimit.current = parseRateLimitHeaders(response.headers) ?? rateLimit.current;

    let attempts = 0;
    while (respectRateLimits && response.status === 429 && attempts < maxRetries) {
      attempts += 1;
      const delay = retryDelayFromRateLimit(rateLimit.current);
      if (delay > 0) {
        await sleep(delay);
      }

      response = await fetchImpl(cloneRequestInput(retryableInput), init);
      rateLimit.current = parseRateLimitHeaders(response.headers) ?? rateLimit.current;
    }

    return response;
  };
};

const cloneRequestInput = (input: RequestInfo | URL): RequestInfo | URL => {
  if (input instanceof Request) {
    return input.clone();
  }

  return input;
};

const parseNumber = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseUnixDate = (value: string | null) => {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : new Date(parsed * 1000);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
