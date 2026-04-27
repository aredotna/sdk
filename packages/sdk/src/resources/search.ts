import { search } from "../generated/sdk.gen";
import type { SearchData } from "../generated/types.gen";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type SearchOptions = NonNullable<SearchData["query"]>;

export const createSearchResource = ({ client }: ResourceContext) => ({
  query: (query?: SearchOptions, options?: RequestOverrides) =>
    data(search(withClient(client, query ? { query } : undefined, options))),
});

export type SearchResource = ReturnType<typeof createSearchResource>;
