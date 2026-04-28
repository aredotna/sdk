import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { ArenaContext } from "./provider";
import { arenaQueryKeys } from "./query-keys";

export const useArena = () => {
  const arena = useContext(ArenaContext);

  if (!arena) {
    throw new Error("useArena must be used within an ArenaProvider.");
  }

  return arena;
};

export const useInvalidateArena = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: arenaQueryKeys.all });
};
