import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChannelFollowers, useGroupContents, usePing, useUserGroups } from "../src";
import { createTestArena, json, renderArenaHook } from "./helpers";

describe("expanded query hooks", () => {
  it("loads channel followers", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        data: [{ id: 1, username: "arena" }],
        meta: { current_page: 1, has_more_pages: false, next_page: null },
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useChannelFollowers("notes", { page: 1 }), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.are.na/v3/channels/notes/followers?page=1");
  });

  it("loads group contents", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        data: [{ id: 1, type: "Text" }],
        meta: { current_page: 1, has_more_pages: false, next_page: null },
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useGroupContents("research", { per: 10 }), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.are.na/v3/groups/research/contents?per=10");
  });

  it("loads user groups", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        data: [{ id: 1, name: "Team" }],
        meta: { current_page: 1, has_more_pages: false, next_page: null },
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useUserGroups("damon"), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.are.na/v3/users/damon/groups");
  });

  it("loads ping", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) => json({ ok: true }));
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => usePing(), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.are.na/v3/ping");
  });
});
