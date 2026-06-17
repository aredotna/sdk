export interface PaginatedResponse {
  meta?: {
    current_page: number;
    has_more_pages?: boolean;
    next_page?: number | null;
  };
}

type Operation<TParams, TPage extends PaginatedResponse> = (
  params: TParams & { query?: Record<string, unknown> },
) => Promise<TPage>;

export interface CursorPaginatedResponse {
  meta?: {
    has_more?: boolean;
    next_cursor?: string | null;
    prev_cursor?: string | null;
  };
}

type CursorOperation<TParams, TPage extends CursorPaginatedResponse> = (
  params: TParams & { query?: Record<string, unknown> },
) => Promise<TPage>;

export async function* paginate<
  TParams extends { query?: Record<string, unknown> },
  TPage extends PaginatedResponse,
>(operation: Operation<TParams, TPage>, params: TParams): AsyncGenerator<TPage, void, unknown> {
  let page = Number(params.query?.page ?? 1);

  while (true) {
    const result = await operation({
      ...params,
      query: {
        ...params.query,
        page,
      },
    });

    yield result;

    if (!result.meta?.has_more_pages) {
      return;
    }

    page = result.meta.next_page ?? page + 1;
  }
}

export async function* paginateCursor<
  TParams extends { query?: Record<string, unknown> },
  TPage extends CursorPaginatedResponse,
>(
  operation: CursorOperation<TParams, TPage>,
  params: TParams,
): AsyncGenerator<TPage, void, unknown> {
  const direction =
    params.query?.next !== undefined || params.query?.prev === undefined ? "next" : "prev";
  let cursor = params.query?.[direction];
  const { next: _next, prev: _prev, ...query } = params.query ?? {};

  while (true) {
    const result = await operation({
      ...params,
      query: {
        ...query,
        [direction]: cursor,
      },
    });

    yield result;

    const nextCursor = direction === "next" ? result.meta?.next_cursor : result.meta?.prev_cursor;

    if ((direction === "next" && result.meta?.has_more === false) || !nextCursor) {
      return;
    }

    cursor = nextCursor;
  }
}
