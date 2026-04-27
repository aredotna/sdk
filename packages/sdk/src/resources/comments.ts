import { deleteComment } from "../generated/sdk.gen";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export const createCommentsResource = ({ client }: ResourceContext) => ({
  delete: (id: number, options?: RequestOverrides) =>
    data(deleteComment(withClient(client, { path: { id } }, options))),
});

export type CommentsResource = ReturnType<typeof createCommentsResource>;
