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

export interface PaginatedPage {
  meta?: {
    has_more_pages?: boolean;
    next_page?: number | null;
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

export const requestOptions = (signal: AbortSignal | undefined) =>
  signal ? { signal } : undefined;
