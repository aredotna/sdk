import type { PingResponse } from "@aredotna/sdk/api";
import { type ArenaQueryOptions, requestOptions, useArenaQuery } from "../query";
import { arenaQueryKeys } from "../query-keys";

export type UsePingOptions = ArenaQueryOptions<PingResponse>;

export const usePing = (options?: UsePingOptions) => {
  return useArenaQuery({
    options,
    queryFn: (arena, signal) => arena.ping(requestOptions(signal)),
    queryKey: arenaQueryKeys.ping(),
  });
};
