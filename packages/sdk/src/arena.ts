import { type ArenaClient, createClientWithState } from "./client";
import { getCurrentUser, getPing } from "./generated/sdk.gen";
import type { ArenaOptions } from "./options";
import type { RateLimitInfo } from "./rate-limit";
import { type BlocksResource, createBlocksResource } from "./resources/blocks";
import { type ChannelsResource, createChannelsResource } from "./resources/channels";
import { type CommentsResource, createCommentsResource } from "./resources/comments";
import { type ConnectionsResource, createConnectionsResource } from "./resources/connections";
import { createGroupsResource, type GroupsResource } from "./resources/groups";
import { createSearchResource, type SearchResource } from "./resources/search";
import { data, type RequestOverrides, withClient } from "./resources/shared";
import { createUsersResource, type UsersResource } from "./resources/users";
import { createUploadsResource, type UploadsResource } from "./uploads";

export interface Arena {
  readonly blocks: BlocksResource;
  readonly channels: ChannelsResource;
  readonly client: ArenaClient;
  readonly comments: CommentsResource;
  readonly connections: ConnectionsResource;
  readonly groups: GroupsResource;
  readonly rateLimit: RateLimitInfo | undefined;
  readonly search: SearchResource;
  readonly uploads: UploadsResource;
  readonly users: UsersResource;
  me(options?: RequestOverrides): ReturnType<typeof me>;
  ping(options?: RequestOverrides): ReturnType<typeof ping>;
}

export const createArena = (options: ArenaOptions = {}): Arena => {
  const { client, rateLimit } = createClientWithState({
    ...options,
    normalizeErrors: true,
    throwOnError: true,
  });
  const context = { client };

  return {
    blocks: createBlocksResource(context),
    channels: createChannelsResource(context),
    client,
    comments: createCommentsResource(context),
    connections: createConnectionsResource(context),
    get rateLimit() {
      return rateLimit.current;
    },
    groups: createGroupsResource(context),
    me: (requestOptions?: RequestOverrides) => me(client, requestOptions),
    ping: (requestOptions?: RequestOverrides) => ping(client, requestOptions),
    search: createSearchResource(context),
    uploads: createUploadsResource(context),
    users: createUsersResource(context),
  };
};

const me = (client: ArenaClient, options?: RequestOverrides) =>
  data(getCurrentUser(withClient(client, undefined, options)));

const ping = (client: ArenaClient, options?: RequestOverrides) =>
  data(getPing(withClient(client, undefined, options)));
