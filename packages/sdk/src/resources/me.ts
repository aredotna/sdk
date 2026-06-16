import {
  getCurrentUser,
  getMyFeed,
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from "../generated/sdk.gen";
import type { GetMyFeedData, GetMyNotificationsData } from "../generated/types.gen";
import { paginateCursor } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type MyFeedOptions = NonNullable<GetMyFeedData["query"]>;
export type MyNotificationsOptions = NonNullable<GetMyNotificationsData["query"]>;

export const createMeResource = ({ client }: ResourceContext) => {
  const me = (options?: RequestOverrides) =>
    data(getCurrentUser(withClient(client, undefined, options)));

  return Object.assign(me, {
    feed: (query?: MyFeedOptions, options?: RequestOverrides) =>
      data(getMyFeed(withClient(client, query ? { query } : undefined, options))),

    paginateFeed: (query?: MyFeedOptions, options?: RequestOverrides) =>
      paginateCursor((params) => data(getMyFeed(withClient(client, params, options))), {
        query,
      }),

    notifications: (query?: MyNotificationsOptions, options?: RequestOverrides) =>
      data(getMyNotifications(withClient(client, query ? { query } : undefined, options))),

    paginateNotifications: (query?: MyNotificationsOptions, options?: RequestOverrides) =>
      paginateCursor((params) => data(getMyNotifications(withClient(client, params, options))), {
        query,
      }),

    markNotificationRead: (id: number, options?: RequestOverrides) =>
      data(markMyNotificationRead(withClient(client, { path: { id } }, options))),

    markAllNotificationsRead: (options?: RequestOverrides) =>
      data(markAllMyNotificationsRead(withClient(client, undefined, options))),
  });
};

export type MeResource = ReturnType<typeof createMeResource>;
