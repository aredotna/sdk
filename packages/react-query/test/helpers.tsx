import { type Arena, createArena } from "@aredotna/sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderHookOptions, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { ArenaProvider } from "../src";

export const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

export const createTestArena = (fetch: typeof globalThis.fetch) => createArena({ fetch });

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

export const createWrapper = ({
  arena,
  queryClient = createTestQueryClient(),
}: {
  arena: Arena;
  queryClient?: QueryClient;
}) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <ArenaProvider arena={arena}>{children}</ArenaProvider>
    </QueryClientProvider>
  );

  return { queryClient, wrapper: Wrapper };
};

export const renderArenaHook = <TResult, TProps>(
  callback: (initialProps: TProps) => TResult,
  options: RenderHookOptions<TProps> & { arena: Arena; queryClient?: QueryClient },
) => {
  const { arena, queryClient, ...renderOptions } = options;
  const wrapper = createWrapper(queryClient ? { arena, queryClient } : { arena }).wrapper;
  return renderHook(callback, { ...renderOptions, wrapper });
};
