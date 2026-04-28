import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChannel } from "../src";
import { createTestArena, json, renderArenaHook } from "./helpers";

describe("useChannel", () => {
  it("loads a channel through the Arena facade", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        id: 1,
        title: "Arena Influences",
        type: "Channel",
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useChannel("arena-influences"), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({ title: "Arena Influences" });
    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.are.na/v3/channels/arena-influences");
  });
});
