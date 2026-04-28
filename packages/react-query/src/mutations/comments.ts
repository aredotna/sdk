import type { Comment } from "@aredotna/sdk";
import type { CreateBlockCommentData, DeleteCommentResponse } from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type CreateBlockCommentVariables = {
  body: CreateBlockCommentData["body"];
  blockId: number;
};
type DeleteCommentVariables = {
  id: number;
};

export type UseCreateBlockCommentOptions = ArenaMutationOptions<
  Comment,
  CreateBlockCommentVariables
>;
export type UseDeleteCommentOptions = ArenaMutationOptions<
  DeleteCommentResponse,
  DeleteCommentVariables
>;

export const useCreateBlockComment = (options?: UseCreateBlockCommentOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ blockId, body }) => arena.blocks.comment(blockId, body),
  } satisfies {
    mutationFn: (variables: CreateBlockCommentVariables) => Promise<Comment>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useDeleteComment = (options?: UseDeleteCommentOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ id }) => arena.comments.delete(id),
  } satisfies {
    mutationFn: (variables: DeleteCommentVariables) => Promise<DeleteCommentResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
