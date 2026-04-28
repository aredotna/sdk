import type { Arena } from "@aredotna/sdk";
import { createContext, type PropsWithChildren } from "react";

export const ArenaContext = createContext<Arena | null>(null);

export interface ArenaProviderProps extends PropsWithChildren {
  arena: Arena;
}

export const ArenaProvider = ({ arena, children }: ArenaProviderProps) => (
  <ArenaContext.Provider value={arena}>{children}</ArenaContext.Provider>
);
