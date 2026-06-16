import type { Arena } from "@aredotna/sdk";
import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useArena } from "./use-arena";

export type ArenaQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, QueryKey>,
  "queryFn" | "queryKey"
>;

export type ArenaInfiniteQueryOptions<TPage> = Omit<
  UseInfiniteQueryOptions<TPage, Error, InfiniteData<TPage>, QueryKey, number>,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
>;

/**
 * Page param for cursor-based infinite queries.
 *
 * - `{ next }` pages toward older items (forward through history).
 * - `{ prev }` pages toward newer items.
 * - `null` is the initial page, which uses the query's own cursors (if any).
 */
export type CursorPageParam = { next: string } | { prev: string } | null;

export type ArenaCursorInfiniteQueryOptions<TPage> = Omit<
  UseInfiniteQueryOptions<TPage, Error, InfiniteData<TPage>, QueryKey, CursorPageParam>,
  "getNextPageParam" | "getPreviousPageParam" | "initialPageParam" | "queryFn" | "queryKey"
>;

export interface PaginatedPage {
  meta?: {
    has_more_pages?: boolean;
    next_page?: number | null;
  };
}

export interface CursorPaginatedPage {
  meta?: {
    has_more?: boolean;
    next_cursor?: string | null;
    prev_cursor?: string | null;
  };
}

export const useArenaQuery = <TData>({
  options,
  queryFn,
  queryKey,
}: {
  options: ArenaQueryOptions<TData> | undefined;
  queryFn: (arena: Arena, signal: AbortSignal | undefined) => Promise<TData>;
  queryKey: QueryKey;
}) => {
  const arena = useArena();

  return useQuery({
    queryFn: ({ signal }) => queryFn(arena, signal),
    queryKey,
    ...options,
  });
};

export const useArenaInfiniteQuery = <TPage extends PaginatedPage>({
  initialPage = 1,
  options,
  queryFn,
  queryKey,
}: {
  initialPage?: number;
  options: ArenaInfiniteQueryOptions<TPage> | undefined;
  queryFn: (arena: Arena, page: number, signal: AbortSignal | undefined) => Promise<TPage>;
  queryKey: QueryKey;
}) => {
  const arena = useArena();

  return useInfiniteQuery({
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? lastPage.meta.next_page : undefined,
    initialPageParam: initialPage,
    queryFn: ({ pageParam, signal }) => queryFn(arena, Number(pageParam), signal),
    queryKey,
    ...options,
  });
};

export const useArenaCursorInfiniteQuery = <TPage extends CursorPaginatedPage>({
  options,
  queryFn,
  queryKey,
}: {
  options: ArenaCursorInfiniteQueryOptions<TPage> | undefined;
  queryFn: (
    arena: Arena,
    pageParam: CursorPageParam,
    signal: AbortSignal | undefined,
  ) => Promise<TPage>;
  queryKey: QueryKey;
}) => {
  const arena = useArena();

  return useInfiniteQuery({
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.has_more === false) {
        return undefined;
      }
      return lastPage.meta?.next_cursor ? { next: lastPage.meta.next_cursor } : undefined;
    },
    getPreviousPageParam: (firstPage) =>
      firstPage.meta?.prev_cursor ? { prev: firstPage.meta.prev_cursor } : undefined,
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) => queryFn(arena, pageParam, signal),
    queryKey,
    ...options,
  });
};

export const requestOptions = (signal: AbortSignal | undefined) =>
  signal ? { signal } : undefined;
