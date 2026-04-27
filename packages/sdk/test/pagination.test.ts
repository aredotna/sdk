import { describe, expect, it } from "vitest";
import { paginate } from "../src";

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
});
