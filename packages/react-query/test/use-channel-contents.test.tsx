import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChannelContents, useInfiniteChannelContents } from "../src";
import { createTestArena, json, renderArenaHook } from "./helpers";

describe("useChannelContents", () => {
  it("loads a normal paginated channel contents page", async () => {
    const fetch = vi.fn(async () =>
      json({
        data: [{ id: 1, type: "Text" }],
        meta: {
          current_page: 1,
          has_more_pages: true,
          next_page: 2,
          per_page: 1,
          prev_page: null,
          total_count: 2,
          total_pages: 2,
        },
      }),
    );
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(
      () => useChannelContents("arena-influences", { page: 1, per: 1 }),
      {
        arena,
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.meta?.next_page).toBe(2);
  });

  it("loads infinite channel contents and fetches the next page", async () => {
    const fetch = vi.fn(async (request) => {
      const url = new URL((request as Request).url);
      const page = Number(url.searchParams.get("page") ?? "1");

      return json({
        data: [{ id: page, type: "Text" }],
        meta: {
          current_page: page,
          has_more_pages: page === 1,
          next_page: page === 1 ? 2 : null,
          per_page: 1,
          prev_page: page === 1 ? null : 1,
          total_count: 2,
          total_pages: 2,
        },
      });
    });
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(
      () => useInfiniteChannelContents("arena-influences", { per: 1 }),
      {
        arena,
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
