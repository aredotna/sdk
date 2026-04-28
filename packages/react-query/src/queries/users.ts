import type { User } from "@aredotna/sdk";
import type {
  ConnectableListResponse,
  FollowableListResponse,
  GetUserContentsData,
  GetUserFollowersData,
  GetUserFollowingData,
  GetUserGroupsData,
  GroupListResponse,
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

type UserContentsQuery = NonNullable<GetUserContentsData["query"]>;
type UserFollowersQuery = NonNullable<GetUserFollowersData["query"]>;
type UserFollowingQuery = NonNullable<GetUserFollowingData["query"]>;
type UserGroupsQuery = NonNullable<GetUserGroupsData["query"]>;

export type UseMeOptions = ArenaQueryOptions<User>;
export type UseUserOptions = ArenaQueryOptions<User>;
export type UseUserContentsOptions = ArenaQueryOptions<ConnectableListResponse>;
export type UseInfiniteUserContentsOptions = ArenaInfiniteQueryOptions<ConnectableListResponse>;
export type UseUserFollowersOptions = ArenaQueryOptions<UserListResponse>;
export type UseUserFollowingOptions = ArenaQueryOptions<FollowableListResponse>;
export type UseUserGroupsOptions = ArenaQueryOptions<GroupListResponse>;

export const useMe = (options?: UseMeOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.me(requestOptions(signal)),
    queryKey: arenaQueryKeys.me(),
  });
};

export const useUser = (id: string | number, options?: UseUserOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.users.get(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.detail(id),
  });
};

export const useUserContents = (
  id: string | number,
  query?: UserContentsQuery,
  options?: UseUserContentsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.users.contents(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.contents(id, query),
  });
};

export const useInfiniteUserContents = (
  id: string | number,
  query?: UserContentsQuery,
  options?: UseInfiniteUserContentsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.users.contents(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.contentsInfinite(id, query),
  });
};

export const useUserFollowers = (
  id: string | number,
  query?: UserFollowersQuery,
  options?: UseUserFollowersOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.users.followers(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.followers(id, query),
  });
};

export const useUserFollowing = (
  id: string | number,
  query?: UserFollowingQuery,
  options?: UseUserFollowingOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.users.following(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.following(id, query),
  });
};

export const useUserGroups = (
  id: string | number,
  query?: UserGroupsQuery,
  options?: UseUserGroupsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.users.groups(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.users.groups(id, query),
  });
};
