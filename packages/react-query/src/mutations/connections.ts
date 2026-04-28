import type { Connection } from "@aredotna/sdk";
import type {
  CreateConnectionData,
  CreateConnectionResponse,
  DeleteConnectionResponse,
  MoveConnectionData,
  UpdateConnectionData,
} from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type CreateConnectionInput = CreateConnectionData["body"];
type MoveConnectionVariables = {
  body: MoveConnectionData["body"];
  id: number;
};
type UpdateConnectionVariables = {
  body: UpdateConnectionData["body"];
  id: number;
};
type DeleteConnectionVariables = {
  id: number;
};

export type UseCreateConnectionOptions = ArenaMutationOptions<
  CreateConnectionResponse,
  CreateConnectionInput
>;
export type UseMoveConnectionOptions = ArenaMutationOptions<Connection, MoveConnectionVariables>;
export type UseUpdateConnectionOptions = ArenaMutationOptions<
  Connection,
  UpdateConnectionVariables
>;
export type UseDeleteConnectionOptions = ArenaMutationOptions<
  DeleteConnectionResponse,
  DeleteConnectionVariables
>;

export const useCreateConnection = (options?: UseCreateConnectionOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: (input) => arena.connections.create(input),
  } satisfies {
    mutationFn: (input: CreateConnectionInput) => Promise<CreateConnectionResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useMoveConnection = (options?: UseMoveConnectionOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ body, id }) => arena.connections.move(id, body),
  } satisfies {
    mutationFn: (variables: MoveConnectionVariables) => Promise<Connection>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useUpdateConnection = (options?: UseUpdateConnectionOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ body, id }) => arena.connections.update(id, body),
  } satisfies {
    mutationFn: (variables: UpdateConnectionVariables) => Promise<Connection>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useDeleteConnection = (options?: UseDeleteConnectionOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ id }) => arena.connections.delete(id),
  } satisfies {
    mutationFn: (variables: DeleteConnectionVariables) => Promise<DeleteConnectionResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
