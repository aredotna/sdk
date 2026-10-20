import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  useBatchCreateBlocks,
  useCreateBlock,
  useCreateChannel,
  useUpdateChannel,
  useUpdateGroupMember,
} from "../src";
import { createTestArena, createTestQueryClient, json, renderArenaHook } from "./helpers";

describe("mutation hooks", () => {
  it.each([true, false])("updates group roles with invalidation=%s", async (invalidate) => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({ id: 42, role: "admin", username: "member" }),
    );
    const arena = createTestArena(fetch);
    const queryClient = createTestQueryClient();
    const key = ["arena", "groups", "studio", "members"];
    queryClient.setQueryData(key, [{ id: 42, role: "member" }]);
    const { result } = renderArenaHook(
      () => useUpdateGroupMember(invalidate ? undefined : { invalidate: false }),
      { arena, queryClient },
    );

    result.current.mutate({ id: "studio", userId: 42, body: { role: "admin" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 42, role: "admin" });
    const request = new Request(fetch.mock.calls[0]![0]);
    expect(request.url).toBe("https://api.are.na/v3/groups/studio/members/42");
    expect(request.method).toBe("PATCH");
    expect(await request.json()).toEqual({ role: "admin" });
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(invalidate);
  });

  it("creates channels and invalidates arena queries by default", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        id: 1,
        title: "New Channel",
        type: "Channel",
      }),
    );
    const arena = createTestArena(fetch);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["arena", "channels"], [{ id: 1 }]);
    const { result } = renderArenaHook(() => useCreateChannel(), { arena, queryClient });

    result.current.mutate({ title: "New Channel" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryState(["arena", "channels"])?.isInvalidated).toBe(true);
  });

  it("creates blocks and supports invalidate:false", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        id: 1,
        type: "Text",
      }),
    );
    const arena = createTestArena(fetch);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["arena", "blocks"], [{ id: 1 }]);
    const { result } = renderArenaHook(() => useCreateBlock({ invalidate: false }), {
      arena,
      queryClient,
    });

    result.current.mutate({
      channels: [{ id: 1 }],
      value: "hello",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryState(["arena", "blocks"])?.isInvalidated).toBe(false);
  });

  it("updates channels through the Arena facade", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        id: 1,
        title: "Updated",
        type: "Channel",
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useUpdateChannel(), { arena });

    result.current.mutate({
      body: { title: "Updated" },
      id: "notes",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).method).toBe("PUT");
    expect((request as Request).url).toBe("https://api.are.na/v3/channels/notes");
  });

  it("batch creates blocks", async () => {
    const fetch = vi.fn(async (_request: RequestInfo | URL) =>
      json({
        batch_id: "batch-1",
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useBatchCreateBlocks(), { arena });

    result.current.mutate({
      blocks: [{ value: "one" }, { value: "two" }],
      channel_ids: [1],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).method).toBe("POST");
    expect((request as Request).url).toBe("https://api.are.na/v3/blocks/batch");
  });
});
