import type { Group, GroupInvite } from "@aredotna/sdk";
import type {
  ConnectableListResponse,
  GetGroupContentsData,
  GetGroupFollowersData,
  GetGroupInvitationsData,
  GetGroupMembersData,
  GroupMemberListResponse,
  MembershipInvitationListResponse,
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
type GroupMembersQuery = NonNullable<GetGroupMembersData["query"]>;
type GroupInvitationsQuery = NonNullable<GetGroupInvitationsData["query"]>;

export type UseGroupOptions = ArenaQueryOptions<Group>;
export type UseGroupContentsOptions = ArenaQueryOptions<ConnectableListResponse>;
export type UseInfiniteGroupContentsOptions = ArenaInfiniteQueryOptions<ConnectableListResponse>;
export type UseGroupFollowersOptions = ArenaQueryOptions<UserListResponse>;
export type UseGroupMembersOptions = ArenaQueryOptions<GroupMemberListResponse>;
export type UseInfiniteGroupMembersOptions = ArenaInfiniteQueryOptions<GroupMemberListResponse>;
export type UseGroupInvitationsOptions = ArenaQueryOptions<MembershipInvitationListResponse>;
export type UseInfiniteGroupInvitationsOptions =
  ArenaInfiniteQueryOptions<MembershipInvitationListResponse>;
export type UseGroupInviteOptions = ArenaQueryOptions<GroupInvite>;

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

export const useGroupMembers = (
  id: string | number,
  query?: GroupMembersQuery,
  options?: UseGroupMembersOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.members(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.members(id, query),
  });
};

export const useInfiniteGroupMembers = (
  id: string | number,
  query?: GroupMembersQuery,
  options?: UseInfiniteGroupMembersOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.groups.members(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.membersInfinite(id, query),
  });
};

export const useGroupInvitations = (
  id: string | number,
  query?: GroupInvitationsQuery,
  options?: UseGroupInvitationsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.invitations(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.invitations(id, query),
  });
};

export const useInfiniteGroupInvitations = (
  id: string | number,
  query?: GroupInvitationsQuery,
  options?: UseInfiniteGroupInvitationsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.groups.invitations(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.invitationsInfinite(id, query),
  });
};

export const useGroupInvite = (id: string | number, options?: UseGroupInviteOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.groups.inviteCode(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.groups.invite(id),
  });
};
