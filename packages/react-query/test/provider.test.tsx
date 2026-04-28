import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useArena, useInvalidateArena } from "../src";
import { createTestArena, createTestQueryClient, json, renderArenaHook } from "./helpers";

describe("ArenaProvider", () => {
  it("provides the Arena instance", () => {
    const arena = createTestArena(async () => json({ ok: true }));
    const { result } = renderArenaHook(() => useArena(), { arena });

    expect(result.current).toBe(arena);
  });

  it("invalidates the arena query namespace", async () => {
    const arena = createTestArena(async () => json({ ok: true }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["arena", "channels", "test"], { title: "Cached" });
    const { result } = renderArenaHook(() => useInvalidateArena(), { arena, queryClient });

    await result.current();

    await waitFor(() => {
      expect(queryClient.getQueryState(["arena", "channels", "test"])?.isInvalidated).toBe(true);
    });
  });
});
