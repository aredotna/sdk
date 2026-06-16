import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useInfiniteMyNotifications } from "../src";
import { createTestArena, json, renderArenaHook } from "./helpers";

describe("useInfiniteMyNotifications", () => {
  it("pages toward older items with next and toward newer items with prev", async () => {
    const fetch = vi.fn(async (request) => {
      const url = new URL((request as Request).url);
      const next = url.searchParams.get("next");
      const prev = url.searchParams.get("prev");

      if (prev === "prev-1") {
        return json({
          data: [{ id: 0, is_read: false, type: "Notification" }],
          meta: { has_more: true, limit: 1, next_cursor: "next-1", prev_cursor: "prev-0" },
        });
      }

      if (next === "next-1") {
        return json({
          data: [{ id: 2, is_read: false, type: "Notification" }],
          meta: { has_more: false, limit: 1, next_cursor: null, prev_cursor: "prev-2" },
        });
      }

      return json({
        data: [{ id: 1, is_read: false, type: "Notification" }],
        meta: { has_more: true, limit: 1, next_cursor: "next-1", prev_cursor: "prev-1" },
      });
    });
    const arena = createTestArena(fetch);
    const { result } = renderArenaHook(() => useInfiniteMyNotifications({ limit: 1 }), { arena });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(new URL((fetch.mock.calls[1]?.[0] as Request).url).searchParams.get("next")).toBe(
      "next-1",
    );

    await result.current.fetchPreviousPage();
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(3));
    expect(new URL((fetch.mock.calls[2]?.[0] as Request).url).searchParams.get("prev")).toBe(
      "prev-1",
    );
  });
});
