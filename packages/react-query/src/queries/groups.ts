import type { Group } from "@aredotna/sdk";
import type {
  ConnectableListResponse,
  GetGroupContentsData,
  GetGroupFollowersData,
  UserListResponse,
} from "@aredotna/sdk/api";
import {
  type ArenaInfiniteQueryOptions,
  type ArenaQueryOptions,
  requestOptions,
  useArenaInfiniteQuery,
  useArenaQuery,
} from "../query";
import { arenaQueryKeys } from "../query-keys";

type GroupContentsQuery = NonNullable<GetGroupContentsData["query"]>;
type GroupFollowersQuery = NonNullable<GetGroupFollowersData["query"]>;

export type UseGroupOptions = ArenaQueryOptions<Group>;
export type UseGroupContentsOptions = ArenaQueryOptions<ConnectableListResponse>;
export type UseInfiniteGroupContentsOptions = ArenaInfiniteQueryOptions<ConnectableListResponse>;
export type UseGroupFollowersOptions = ArenaQueryOptions<UserListResponse>;

export const useGroup = (id: string | number, options?: UseGroupOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.get(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.detail(id),
  });
};

export const useGroupContents = (
  id: string | number,
  query?: GroupContentsQuery,
  options?: UseGroupContentsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.contents(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.contents(id, query),
  });
};

export const useInfiniteGroupContents = (
  id: string | number,
  query?: GroupContentsQuery,
  options?: UseInfiniteGroupContentsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.groups.contents(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.contentsInfinite(id, query),
  });
};

export const useGroupFollowers = (
  id: string | number,
  query?: GroupFollowersQuery,
  options?: UseGroupFollowersOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.followers(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.followers(id, query),
  });
};
