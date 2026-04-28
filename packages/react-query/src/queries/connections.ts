import type { Connection } from "@aredotna/sdk";
import { type ArenaQueryOptions, requestOptions, useArenaQuery } from "../query";
import { arenaQueryKeys } from "../query-keys";

export type UseConnectionOptions = ArenaQueryOptions<Connection>;

export const useConnection = (id: number, options?: UseConnectionOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.connections.get(id, requestOptions(signal)),
    queryKey: arenaQueryKeys.connections.detail(id),
  });
};
