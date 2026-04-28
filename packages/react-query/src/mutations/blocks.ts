import type { Block } from "@aredotna/sdk";
import type {
  BatchCreateBlocksData,
  BatchCreateBlocksResponse,
  CreateBlockData,
  UpdateBlockData,
} from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type CreateBlockInput = CreateBlockData["body"];
type BatchCreateBlocksInput = BatchCreateBlocksData["body"];
type UpdateBlockVariables = {
  body: UpdateBlockData["body"];
  id: number;
};
type CreateBlockResult = Block;

export type UseCreateBlockOptions = ArenaMutationOptions<CreateBlockResult, CreateBlockInput>;
export type UseBatchCreateBlocksOptions = ArenaMutationOptions<
  BatchCreateBlocksResponse,
  BatchCreateBlocksInput
>;
export type UseUpdateBlockOptions = ArenaMutationOptions<Block, UpdateBlockVariables>;

export const useCreateBlock = (options?: UseCreateBlockOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: (input) => arena.blocks.create(input),
  } satisfies {
    mutationFn: (input: CreateBlockInput) => Promise<CreateBlockResult>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useBatchCreateBlocks = (options?: UseBatchCreateBlocksOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: (input) => arena.blocks.batchCreate(input),
  } satisfies {
    mutationFn: (input: BatchCreateBlocksInput) => Promise<BatchCreateBlocksResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useUpdateBlock = (options?: UseUpdateBlockOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ body, id }) => arena.blocks.update(id, body),
  } satisfies {
    mutationFn: (variables: UpdateBlockVariables) => Promise<Block>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
