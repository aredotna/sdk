import type { EverythingListResponse, SearchData } from "@aredotna/sdk/api";
import {
  type ArenaInfiniteQueryOptions,
  type ArenaQueryOptions,
  requestOptions,
  useArenaInfiniteQuery,
  useArenaQuery,
} from "../query";
import { arenaQueryKeys } from "../query-keys";

type SearchQuery = NonNullable<SearchData["query"]>;

export type UseSearchOptions = ArenaQueryOptions<EverythingListResponse>;
export type UseInfiniteSearchOptions = ArenaInfiniteQueryOptions<EverythingListResponse>;

export const useSearch = (query?: SearchQuery, options?: UseSearchOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.search.query(query, requestOptions(signal)),
    queryKey: arenaQueryKeys.search(query),
  });
};

export const useInfiniteSearch = (query?: SearchQuery, options?: UseInfiniteSearchOptions) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.search.query({ ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.searchInfinite(query),
  });
};
