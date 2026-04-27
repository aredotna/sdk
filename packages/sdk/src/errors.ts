import type { RateLimitInfo } from "./rate-limit";

export interface ArenaApiErrorOptions {
  cause?: unknown;
  details?: unknown;
  error?: string;
  rateLimit?: RateLimitInfo;
  request?: Request;
  response?: Response;
  status: number;
}

export class ArenaError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    this.cause = options?.cause;
  }
}

export class ArenaNetworkError extends ArenaError {
  readonly request?: Request;

  constructor(cause: unknown, request?: Request) {
    super("Are.na request failed before receiving a response.", { cause });
    this.request = request;
  }
}

export class ArenaApiError extends ArenaError {
  readonly code?: number;
  readonly details?: unknown;
  readonly error?: string;
  readonly rateLimit?: RateLimitInfo;
  readonly request?: Request;
  readonly response?: Response;
  readonly status: number;

  constructor(message: string, options: ArenaApiErrorOptions) {
    super(message, { cause: options.cause });
    this.status = options.status;
    this.request = options.request;
    this.response = options.response;
    this.error = options.error;
    this.details = options.details;
    this.rateLimit = options.rateLimit;
    this.code = typeof options.details === "object" ? undefined : undefined;
  }
}

export class ArenaValidationError extends ArenaApiError {}
export class ArenaAuthError extends ArenaApiError {}
export class ArenaForbiddenError extends ArenaApiError {}
export class ArenaNotFoundError extends ArenaApiError {}

export class ArenaRateLimitError extends ArenaApiError {
  readonly retryAfter?: Date;

  constructor(message: string, options: ArenaApiErrorOptions) {
    super(message, options);
    this.retryAfter = options.rateLimit?.reset;
  }
}

export const createArenaError = ({
  cause,
  error,
  rateLimit,
  request,
  response,
}: {
  cause: unknown;
  error?: unknown;
  rateLimit?: RateLimitInfo;
  request?: Request;
  response?: Response;
}) => {
  if (!response) {
    return new ArenaNetworkError(cause, request);
  }

  const normalized = normalizeErrorBody(error ?? cause);
  const message =
    normalized.message ??
    normalized.error ??
    response.statusText ??
    `Are.na API request failed with status ${response.status}.`;

  const options: ArenaApiErrorOptions = {
    cause,
    details: normalized.details,
    error: normalized.error,
    rateLimit,
    request,
    response,
    status: response.status,
  };

  switch (response.status) {
    case 400:
      return new ArenaValidationError(message, options);
    case 401:
      return new ArenaAuthError(message, options);
    case 403:
      return new ArenaForbiddenError(message, options);
    case 404:
      return new ArenaNotFoundError(message, options);
    case 429:
      return new ArenaRateLimitError(message, options);
    default:
      return new ArenaApiError(message, options);
  }
};

const normalizeErrorBody = (body: unknown) => {
  if (typeof body === "string") {
    return { message: body };
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const details = record.details;
    const nestedMessage =
      details && typeof details === "object"
        ? (details as Record<string, unknown>).message
        : undefined;

    return {
      details,
      error: typeof record.error === "string" ? record.error : undefined,
      message:
        typeof nestedMessage === "string"
          ? nestedMessage
          : typeof record.error_description === "string"
            ? record.error_description
            : typeof record.message === "string"
              ? record.message
              : undefined,
    };
  }

  return {};
};
