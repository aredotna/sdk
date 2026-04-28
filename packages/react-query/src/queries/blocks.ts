import type { Block } from "@aredotna/sdk";
import type {
  ChannelListResponse,
  CommentListResponse,
  GetBatchStatusResponse,
  GetBlockCommentsData,
  GetBlockConnectionsData,
} from "@aredotna/sdk/api";
import {
  type ArenaInfiniteQueryOptions,
  type ArenaQueryOptions,
  requestOptions,
  useArenaInfiniteQuery,
  useArenaQuery,
} from "../query";
import { arenaQueryKeys } from "../query-keys";

type BlockConnectionsQuery = NonNullable<GetBlockConnectionsData["query"]>;
type BlockCommentsQuery = NonNullable<GetBlockCommentsData["query"]>;

export type UseBlockOptions = ArenaQueryOptions<Block>;
export type UseBlockConnectionsOptions = ArenaQueryOptions<ChannelListResponse>;
export type UseInfiniteBlockConnectionsOptions = ArenaInfiniteQueryOptions<ChannelListResponse>;
export type UseBlockCommentsOptions = ArenaQueryOptions<CommentListResponse>;
export type UseInfiniteBlockCommentsOptions = ArenaInfiniteQueryOptions<CommentListResponse>;
export type UseBlockBatchStatusOptions = ArenaQueryOptions<GetBatchStatusResponse>;

export const useBlock = (id: number, options?: UseBlockOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.blocks.get(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.detail(id),
  });
};

export const useBlockConnections = (
  id: number,
  query?: BlockConnectionsQuery,
  options?: UseBlockConnectionsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.blocks.connections(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.connections(id, query),
  });
};

export const useInfiniteBlockConnections = (
  id: number,
  query?: BlockConnectionsQuery,
  options?: UseInfiniteBlockConnectionsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.blocks.connections(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.connectionsInfinite(id, query),
  });
};

export const useBlockComments = (
  id: number,
  query?: BlockCommentsQuery,
  options?: UseBlockCommentsOptions,
) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.blocks.comments(id, query, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.comments(id, query),
  });
};

export const useInfiniteBlockComments = (
  id: number,
  query?: BlockCommentsQuery,
  options?: UseInfiniteBlockCommentsOptions,
) => {
  return useArenaInfiniteQuery({
    initialPage: query?.page ?? 1,
    options,
    queryFn: (arena, page, signal) =>
      arena.blocks.comments(id, { ...query, page }, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.commentsInfinite(id, query),
  });
};

export const useBlockBatchStatus = (batchId: string, options?: UseBlockBatchStatusOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.blocks.batchStatus(batchId, requestOptions(signal)),
    queryKey: arenaQueryKeys.blocks.batchStatus(batchId),
  });
};
