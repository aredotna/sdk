import {
  batchCreateBlocks,
  createBlock,
  createBlockComment,
  getBatchStatus,
  getBlock,
  getBlockComments,
  getBlockConnections,
  updateBlock,
} from "../generated/sdk.gen";
import type {
  BatchCreateBlocksData,
  CreateBlockCommentData,
  CreateBlockData,
  GetBlockCommentsData,
  GetBlockConnectionsData,
  UpdateBlockData,
} from "../generated/types.gen";
import { paginate } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type CreateBlockInput = CreateBlockData["body"];
export type BatchCreateBlocksInput = BatchCreateBlocksData["body"];
export type UpdateBlockInput = UpdateBlockData["body"];
export type CreateCommentInput = CreateBlockCommentData["body"];
export type BlockConnectionsOptions = NonNullable<GetBlockConnectionsData["query"]>;
export type BlockCommentsOptions = NonNullable<GetBlockCommentsData["query"]>;

export const createBlocksResource = ({ client }: ResourceContext) => ({
  get: (id: number, options?: RequestOverrides) =>
    data(getBlock(withClient(client, { path: { id } }, options))),

  create: (body: CreateBlockInput, options?: RequestOverrides) =>
    data(createBlock(withClient(client, { body }, options))),

  batchCreate: (body: BatchCreateBlocksInput, options?: RequestOverrides) =>
    data(batchCreateBlocks(withClient(client, { body }, options))),

  batchStatus: (batchId: string, options?: RequestOverrides) =>
    data(getBatchStatus(withClient(client, { path: { batch_id: batchId } }, options))),

  update: (id: number, body: UpdateBlockInput, options?: RequestOverrides) =>
    data(updateBlock(withClient(client, { body, path: { id } }, options))),

  connections: (id: number, query?: BlockConnectionsOptions, options?: RequestOverrides) =>
    data(getBlockConnections(withClient(client, { path: { id }, query }, options))),

  paginateConnections: (id: number, query?: BlockConnectionsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getBlockConnections(withClient(client, params, options))), {
      path: { id },
      query,
    }),

  comments: (id: number, query?: BlockCommentsOptions, options?: RequestOverrides) =>
    data(getBlockComments(withClient(client, { path: { id }, query }, options))),

  paginateComments: (id: number, query?: BlockCommentsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getBlockComments(withClient(client, params, options))), {
      path: { id },
      query,
    }),

  comment: (id: number, body: CreateCommentInput, options?: RequestOverrides) =>
    data(createBlockComment(withClient(client, { body, path: { id } }, options))),
});

export type BlocksResource = ReturnType<typeof createBlocksResource>;
