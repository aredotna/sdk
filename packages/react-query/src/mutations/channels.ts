import type { Channel } from "@aredotna/sdk";
import type {
  CreateChannelData,
  DeleteChannelResponse,
  UpdateChannelData,
} from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type CreateChannelInput = CreateChannelData["body"];
type UpdateChannelVariables = {
  body: UpdateChannelData["body"];
  id: string | number;
};
type DeleteChannelVariables = {
  id: string | number;
};
type CreateChannelResult = Channel;

export type UseCreateChannelOptions = ArenaMutationOptions<CreateChannelResult, CreateChannelInput>;
export type UseUpdateChannelOptions = ArenaMutationOptions<Channel, UpdateChannelVariables>;
export type UseDeleteChannelOptions = ArenaMutationOptions<
  DeleteChannelResponse,
  DeleteChannelVariables
>;

export const useCreateChannel = (options?: UseCreateChannelOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: (input) => arena.channels.create(input),
  } satisfies {
    mutationFn: (input: CreateChannelInput) => Promise<CreateChannelResult>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useUpdateChannel = (options?: UseUpdateChannelOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ body, id }) => arena.channels.update(id, body),
  } satisfies {
    mutationFn: (variables: UpdateChannelVariables) => Promise<Channel>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useDeleteChannel = (options?: UseDeleteChannelOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.channels.delete(id),
  } satisfies {
    mutationFn: (variables: DeleteChannelVariables) => Promise<DeleteChannelResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
