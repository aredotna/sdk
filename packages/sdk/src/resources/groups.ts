import { getGroup, getGroupContents, getGroupFollowers } from "../generated/sdk.gen";
import type { GetGroupContentsData, GetGroupFollowersData } from "../generated/types.gen";
import { paginate } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type GroupId = string | number;
export type GroupContentsOptions = NonNullable<GetGroupContentsData["query"]>;
export type GroupFollowersOptions = NonNullable<GetGroupFollowersData["query"]>;

export const createGroupsResource = ({ client }: ResourceContext) => ({
  get: (id: GroupId, options?: RequestOverrides) =>
    data(getGroup(withClient(client, { path: { id: String(id) } }, options))),

  contents: (id: GroupId, query?: GroupContentsOptions, options?: RequestOverrides) =>
    data(getGroupContents(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateContents: (id: GroupId, query?: GroupContentsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getGroupContents(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  followers: (id: GroupId, query?: GroupFollowersOptions, options?: RequestOverrides) =>
    data(getGroupFollowers(withClient(client, { path: { id: String(id) }, query }, options))),
});

export type GroupsResource = ReturnType<typeof createGroupsResource>;
