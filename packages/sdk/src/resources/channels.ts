import {
  createChannel,
  deleteChannel,
  getChannel,
  getChannelConnections,
  getChannelContents,
  getChannelFollowers,
  updateChannel,
} from "../generated/sdk.gen";
import type {
  CreateChannelData,
  GetChannelConnectionsData,
  GetChannelContentsData,
  GetChannelFollowersData,
  UpdateChannelData,
} from "../generated/types.gen";
import { paginate } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type ChannelId = string | number;
export type CreateChannelInput = CreateChannelData["body"];
export type UpdateChannelInput = UpdateChannelData["body"];
export type ChannelContentsOptions = NonNullable<GetChannelContentsData["query"]>;
export type ChannelConnectionsOptions = NonNullable<GetChannelConnectionsData["query"]>;
export type ChannelFollowersOptions = NonNullable<GetChannelFollowersData["query"]>;

export const createChannelsResource = ({ client }: ResourceContext) => ({
  get: (id: ChannelId, options?: RequestOverrides) =>
    data(getChannel(withClient(client, { path: { id: String(id) } }, options))),

  create: (body: CreateChannelInput, options?: RequestOverrides) =>
    data(createChannel(withClient(client, { body }, options))),

  update: (id: ChannelId, body: UpdateChannelInput, options?: RequestOverrides) =>
    data(updateChannel(withClient(client, { body, path: { id: String(id) } }, options))),

  delete: (id: ChannelId, options?: RequestOverrides) =>
    data(deleteChannel(withClient(client, { path: { id: String(id) } }, options))),

  contents: (id: ChannelId, query?: ChannelContentsOptions, options?: RequestOverrides) =>
    data(getChannelContents(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateContents: (id: ChannelId, query?: ChannelContentsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getChannelContents(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  connections: (id: ChannelId, query?: ChannelConnectionsOptions, options?: RequestOverrides) =>
    data(getChannelConnections(withClient(client, { path: { id: String(id) }, query }, options))),

  followers: (id: ChannelId, query?: ChannelFollowersOptions, options?: RequestOverrides) =>
    data(getChannelFollowers(withClient(client, { path: { id: String(id) }, query }, options))),
});

export type ChannelsResource = ReturnType<typeof createChannelsResource>;
