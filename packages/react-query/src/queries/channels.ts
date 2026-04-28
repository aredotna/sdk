import type { Channel } from "@aredotna/sdk";
import type {
  ChannelListResponse,
  ConnectableListResponse,
  GetChannelConnectionsData,
  GetChannelContentsData,
  GetChannelFollowersData,
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

type ChannelContentsQuery = NonNullable<GetChannelContentsData["query"]>;
type ChannelConnectionsQuery = NonNullable<GetChannelConnectionsData["query"]>;
type ChannelFollowersQuery = NonNullable<GetChannelFollowersData["query"]>;
type ChannelContentsPage = ConnectableListResponse;
type ChannelConnectionsPage = ChannelListResponse;
type ChannelFollowersPage = UserListResponse;

export type UseChannelOptions = ArenaQueryOptions<Channel>;
export type UseChannelContentsOptions = ArenaQueryOptions<ChannelContentsPage>;
export type UseInfiniteChannelContentsOptions = ArenaInfiniteQueryOptions<ChannelContentsPage>;
export type UseChannelConnectionsOptions = ArenaQueryOptions<ChannelConnectionsPage>;
export type UseChannelFollowersOptions = ArenaQueryOptions<ChannelFollowersPage>;

export const useChannel = (id: string | number, options?: UseChannelOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.channels.get(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.channels.detail(id),
  });
};

export const useChannelContents = (
  id: string | number,
  query?: ChannelContentsQuery,
  options?: UseChannelContentsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.channels.contents(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.channels.contents(id, query),
  });
};

export const useInfiniteChannelContents = (
  id: string | number,
  query?: ChannelContentsQuery,
  options?: UseInfiniteChannelContentsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.channels.contents(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.channels.contentsInfinite(id, query),
  });
};

export const useChannelConnections = (
  id: string | number,
  query?: ChannelConnectionsQuery,
  options?: UseChannelConnectionsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.channels.connections(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.channels.connections(id, query),
  });
};

export const useChannelFollowers = (
  id: string | number,
  query?: ChannelFollowersQuery,
  options?: UseChannelFollowersOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.channels.followers(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.channels.followers(id, query),
  });
};
