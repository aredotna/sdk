import {
  getUser,
  getUserContents,
  getUserFollowers,
  getUserFollowing,
  getUserGroups,
} from "../generated/sdk.gen";
import type {
  GetUserContentsData,
  GetUserFollowersData,
  GetUserFollowingData,
  GetUserGroupsData,
} from "../generated/types.gen";
import { paginate } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type UserId = string | number;
export type UserContentsOptions = NonNullable<GetUserContentsData["query"]>;
export type UserFollowersOptions = NonNullable<GetUserFollowersData["query"]>;
export type UserFollowingOptions = NonNullable<GetUserFollowingData["query"]>;
export type UserGroupsOptions = NonNullable<GetUserGroupsData["query"]>;

export const createUsersResource = ({ client }: ResourceContext) => ({
  get: (id: UserId, options?: RequestOverrides) =>
    data(getUser(withClient(client, { path: { id: String(id) } }, options))),

  contents: (id: UserId, query?: UserContentsOptions, options?: RequestOverrides) =>
    data(getUserContents(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateContents: (id: UserId, query?: UserContentsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getUserContents(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  followers: (id: UserId, query?: UserFollowersOptions, options?: RequestOverrides) =>
    data(getUserFollowers(withClient(client, { path: { id: String(id) }, query }, options))),

  following: (id: UserId, query?: UserFollowingOptions, options?: RequestOverrides) =>
    data(getUserFollowing(withClient(client, { path: { id: String(id) }, query }, options))),

  groups: (id: UserId, query?: UserGroupsOptions, options?: RequestOverrides) =>
    data(getUserGroups(withClient(client, { path: { id: String(id) }, query }, options))),
});

export type UsersResource = ReturnType<typeof createUsersResource>;
