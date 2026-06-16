import type {
  FeedListResponse,
  GetMyFeedData,
  GetMyNotificationsData,
  NotificationListResponse,
} from "@aredotna/sdk/api";
import {
  type ArenaCursorInfiniteQueryOptions,
  type ArenaQueryOptions,
  requestOptions,
  useArenaCursorInfiniteQuery,
  useArenaQuery,
} from "../query";
import { arenaQueryKeys } from "../query-keys";

type MyFeedQuery = NonNullable<GetMyFeedData["query"]>;
type MyNotificationsQuery = NonNullable<GetMyNotificationsData["query"]>;
type CursorQuery = {
  next?: string;
  prev?: string;
};

export type UseMyFeedOptions = ArenaQueryOptions<FeedListResponse>;
export type UseInfiniteMyFeedOptions = ArenaCursorInfiniteQueryOptions<FeedListResponse>;
export type UseMyNotificationsOptions = ArenaQueryOptions<NotificationListResponse>;
export type UseInfiniteMyNotificationsOptions =
  ArenaCursorInfiniteQueryOptions<NotificationListResponse>;

export const useMyFeed = (query?: MyFeedQuery, options?: UseMyFeedOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.me.feed(query, requestOptions(signal)),
    queryKey: arenaQueryKeys.me.feed(query),
  });
};

export const useInfiniteMyFeed = (query?: MyFeedQuery, options?: UseInfiniteMyFeedOptions) => {
  return useArenaCursorInfiniteQuery({
    options,
    queryFn: (arena, pageParam, signal) =>
      arena.me.feed(
        pageParam ? { ...withoutCursor(query), ...pageParam } : query,
        requestOptions(signal),
      ),
    queryKey: arenaQueryKeys.me.feedInfinite(query),
  });
};

export const useMyNotifications = (
  query?: MyNotificationsQuery,
  options?: UseMyNotificationsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.me.notifications(query, requestOptions(signal)),
    queryKey: arenaQueryKeys.me.notifications(query),
  });
};

export const useInfiniteMyNotifications = (
  query?: MyNotificationsQuery,
  options?: UseInfiniteMyNotificationsOptions,
) => {
  return useArenaCursorInfiniteQuery({
    options,
    queryFn: (arena, pageParam, signal) =>
      arena.me.notifications(
        pageParam ? { ...withoutCursor(query), ...pageParam } : query,
        requestOptions(signal),
      ),
    queryKey: arenaQueryKeys.me.notificationsInfinite(query),
  });
};

const withoutCursor = <TQuery extends CursorQuery>(query: TQuery | undefined) => {
  const { next: _next, prev: _prev, ...rest } = query ?? {};
  return rest;
};
