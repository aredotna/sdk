import type { ArenaClient } from "../client";

export type RequestOverrides = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export type ResourceContext = {
  client: ArenaClient;
};

export const withClient = <T extends object>(
  client: ArenaClient,
  input?: T,
  overrides?: RequestOverrides,
) =>
  ({
    ...input,
    ...overrides,
    client,
    throwOnError: true as const,
  }) as T & RequestOverrides & { client: ArenaClient; throwOnError: true };

export const data = async <T>(result: Promise<{ data: T }>) => {
  const response = await result;
  return response.data;
};
