import type { RetryOptions } from "./options";

export interface RateLimitInfo {
  bucket?: string;
  cost?: number;
  limit?: number;
  policy?: string;
  remaining?: number;
  reset?: Date;
  tier?: string;
  window?: number;
}

export interface MutableRateLimit {
  current: RateLimitInfo | undefined;
}

export const parseRateLimitHeaders = (headers: Headers): RateLimitInfo | undefined => {
  const bucket = headers.get("X-RateLimit-Bucket") ?? undefined;
  const cost = parseNumber(headers.get("X-RateLimit-Cost"));
  const limit = parseNumber(headers.get("X-RateLimit-Limit"));
  const policy = headers.get("X-RateLimit-Policy") ?? undefined;
  const remaining = parseNumber(headers.get("X-RateLimit-Remaining"));
  const reset = parseUnixDate(headers.get("X-RateLimit-Reset"));
  const tier = headers.get("X-RateLimit-Tier") ?? undefined;
  const window = parseNumber(headers.get("X-RateLimit-Window"));

  const info = { bucket, cost, limit, policy, remaining, reset, tier, window };
  if (Object.values(info).every((value) => value === undefined)) {
    return undefined;
  }

  return info;
};

export const parseRetryAfter = (
  headers: Headers | undefined,
  reset?: Date,
  retryAfterSeconds?: unknown,
): Date | undefined => {
  const value = headers?.get("Retry-After");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return new Date(Date.now() + seconds * 1000);
    }
    if (!Number.isFinite(seconds)) {
      const timestamp = Date.parse(value);
      if (Number.isFinite(timestamp)) {
        return new Date(timestamp);
      }
    }
  }

  if (reset) {
    return reset;
  }

  if (
    typeof retryAfterSeconds === "number" &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds >= 0
  ) {
    return new Date(Date.now() + retryAfterSeconds * 1000);
  }

  return undefined;
};

export const retryDelayFromRateLimit = (rateLimit: RateLimitInfo | undefined) => {
  if (!rateLimit?.reset) {
    return 0;
  }

  return Math.max(0, rateLimit.reset.getTime() - Date.now());
};

export const createRateLimitFetch = ({
  fetchImpl = globalThis.fetch.bind(globalThis),
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
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    signal?.throwIfAborted();
    const retryableInput = cloneRequestInput(input);
    let response = await fetchImpl(input, init);
    rateLimit.current = parseRateLimitHeaders(response.headers) ?? rateLimit.current;

    let attempts = 0;
    while (respectRateLimits && response.status === 429 && attempts < maxRetries) {
      attempts += 1;
      const responseRateLimit = parseRateLimitHeaders(response.headers);
      let retryAfter = parseRetryAfter(response.headers, responseRateLimit?.reset);
      if (!retryAfter) {
        const body = await response
          .clone()
          .json()
          .catch(() => undefined);
        retryAfter = parseRetryAfter(undefined, undefined, body?.error?.retry_after);
      }
      const delay = retryDelayFromRateLimit({ reset: retryAfter });
      if (delay > 0) {
        await sleep(delay, signal);
      }

      signal?.throwIfAborted();
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
  const date = parsed === undefined ? undefined : new Date(parsed * 1000);
  return date && Number.isFinite(date.getTime()) ? date : undefined;
};

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    signal?.throwIfAborted();
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
