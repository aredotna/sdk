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
  let next = params.query?.next;
  const { next: _next, prev: _prev, ...query } = params.query ?? {};

  while (true) {
    const result = await operation({
      ...params,
      query: {
        ...query,
        next,
      },
    });

    yield result;

    if (result.meta?.has_more === false || !result.meta?.next_cursor) {
      return;
    }

    next = result.meta.next_cursor;
  }
}
