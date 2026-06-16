import { describe, expect, it } from "vitest";
import { paginate, paginateCursor } from "../src";

describe("paginate", () => {
  it("walks pages until meta.has_more_pages is false", async () => {
    const pages: Array<number | undefined> = [];
    const seen: Array<number> = [];

    for await (const page of paginate(
      async ({ query }) => {
        pages.push(query?.page as number | undefined);
        return {
          data: [query?.page],
          meta: {
            current_page: query?.page as number,
            has_more_pages: query?.page === 1,
            next_page: query?.page === 1 ? 2 : null,
          },
        };
      },
      { query: { page: 1, per: 10 } },
    )) {
      seen.push(page.meta?.current_page ?? 0);
    }

    expect(pages).toEqual([1, 2]);
    expect(seen).toEqual([1, 2]);
  });

  it("walks cursor pages until meta.has_more is false", async () => {
    const cursors: Array<unknown> = [];
    const seen: Array<number> = [];

    for await (const page of paginateCursor(
      async ({ query }) => {
        cursors.push(query?.next);
        const pageNumber = query?.next === "next-cursor" ? 2 : 1;

        return {
          data: [pageNumber],
          meta: {
            has_more: pageNumber === 1,
            limit: 10,
            next_cursor: pageNumber === 1 ? "next-cursor" : null,
            prev_cursor: null,
          },
        };
      },
      { query: { limit: 10 } },
    )) {
      seen.push(page.data[0] ?? 0);
    }

    expect(cursors).toEqual([undefined, "next-cursor"]);
    expect(seen).toEqual([1, 2]);
  });

  it("stops cursor pagination when has_more is false even if next_cursor is present", async () => {
    const pages: Array<number> = [];

    for await (const page of paginateCursor(
      async ({ query }) => {
        const pageNumber = (query?.next as number | undefined) ?? 1;
        return {
          data: [pageNumber],
          meta: {
            has_more: false,
            limit: 10,
            next_cursor: "still-here",
            prev_cursor: null,
          },
        };
      },
      { query: {} },
    )) {
      pages.push(page.data[0] ?? 0);
    }

    expect(pages).toEqual([1]);
  });

  it("removes stale cursor params while preserving other cursor query options", async () => {
    const queries: Array<Record<string, unknown> | undefined> = [];

    for await (const _page of paginateCursor(
      async ({ query }) => {
        queries.push(query);
        return {
          data: [],
          meta: {
            has_more: false,
            limit: 10,
            next_cursor: null,
            prev_cursor: null,
          },
        };
      },
      { query: { limit: 10, next: "initial-next", prev: "stale-prev" } },
    )) {
      // Exhaust the generator.
    }

    expect(queries).toEqual([{ limit: 10, next: "initial-next" }]);
  });
});
