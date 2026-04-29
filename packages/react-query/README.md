# @aredotna/react-query

TanStack Query hooks for the official Are.na SDK.

This package is intentionally thin: it provides React context, query keys, and TanStack Query
hooks over `@aredotna/sdk`. It does not own OAuth, routing, or token persistence.

## Install

```sh
pnpm add @aredotna/sdk @aredotna/react-query @tanstack/react-query react
```

`@aredotna/sdk`, `@tanstack/react-query`, and `react` are peer dependencies.

## Setup

Create an Arena client and provide it next to your app's `QueryClientProvider`:

```tsx
import { createArena } from "@aredotna/sdk";
import { ArenaProvider } from "@aredotna/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const arena = createArena();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ArenaProvider arena={arena}>{children}</ArenaProvider>
    </QueryClientProvider>
  );
}
```

`ArenaProvider` only provides the Arena client. Your app owns the `QueryClientProvider`.

## Queries

```tsx
import { useChannel, useInfiniteChannelContents, useMe } from "@aredotna/react-query";

function Channel({ id }: { id: string }) {
  const channel = useChannel(id);
  const contents = useInfiniteChannelContents(id, { per: 50 });
  const items = contents.data?.pages.flatMap((page) => page.data) ?? [];

  if (channel.isLoading) return null;

  return (
    <>
      <h1>{channel.data?.title}</h1>
      {items.map((item) => (
        <div key={item.id}>{item.type}</div>
      ))}
      {contents.hasNextPage ? (
        <button onClick={() => contents.fetchNextPage()}>Load more</button>
      ) : null}
    </>
  );
}

function Me() {
  const me = useMe({ enabled: Boolean(sessionStore.getToken()) });
  return <span>{me.data?.username}</span>;
}
```

Normal paginated hooks return one API page. Infinite hooks are named explicitly and return
TanStack Query's `UseInfiniteQueryResult`.

Available read hooks:

- `useMe()`
- `usePing()`
- `useBlock(id)`
- `useBlockConnections(id, query?)`
- `useInfiniteBlockConnections(id, query?)`
- `useBlockComments(id, query?)`
- `useInfiniteBlockComments(id, query?)`
- `useBlockBatchStatus(batchId)`
- `useChannel(id)`
- `useChannelContents(id, query?)`
- `useInfiniteChannelContents(id, query?)`
- `useChannelConnections(id, query?)`
- `useChannelFollowers(id, query?)`
- `useConnection(id)`
- `useGroup(id)`
- `useGroupContents(id, query?)`
- `useInfiniteGroupContents(id, query?)`
- `useGroupFollowers(id, query?)`
- `useUser(id)`
- `useUserContents(id, query?)`
- `useInfiniteUserContents(id, query?)`
- `useUserFollowers(id, query?)`
- `useUserFollowing(id, query?)`
- `useUserGroups(id, query?)`
- `useSearch(query?)`
- `useInfiniteSearch(query?)`

## Mutations

Mutations invalidate the `["arena"]` query namespace by default. Pass `invalidate: false` to
opt out and handle invalidation yourself.

```tsx
import { useCreateBlock, useCreateChannel } from "@aredotna/react-query";

function CreateButtons() {
  const createChannel = useCreateChannel();
  const createBlock = useCreateBlock({ invalidate: false });

  return (
    <>
      <button onClick={() => createChannel.mutate({ title: "Notes", visibility: "private" })}>
        Create channel
      </button>
      <button
        onClick={() =>
          createBlock.mutate({
            channels: [{ id: 123 }],
            value: "https://www.are.na",
          })
        }
      >
        Create block
      </button>
    </>
  );
}
```

Available mutation hooks:

- `useBatchCreateBlocks()`
- `useCreateBlock()`
- `useCreateBlockComment()`
- `useCreateChannel()`
- `useCreateUploadBlock()`
- `useCreateConnection()`
- `useDeleteChannel()`
- `useDeleteComment()`
- `useDeleteConnection()`
- `useMoveConnection()`
- `useUpdateBlock()`
- `useUpdateChannel()`
- `useUpdateConnection()`
- `useUpload()`
- `useUploadMany()`

For custom wrappers, import `useArenaQuery`, `useArenaInfiniteQuery`, `useArenaMutation`,
`requestOptions`, and `arenaQueryKeys` from this package.

## OAuth Integration

Keep OAuth in `@aredotna/sdk/oauth`, store the access token in your app, and use a stable
Arena instance with a lazy token getter. After login/logout, invalidate Arena queries.

```tsx
import { createArena } from "@aredotna/sdk";
import { ArenaProvider, useInvalidateArena } from "@aredotna/react-query";

const arena = createArena({
  token: async () => sessionStore.getToken() ?? undefined,
});

function useCompleteLogin() {
  const invalidateArena = useInvalidateArena();

  return async (accessToken: string) => {
    sessionStore.setToken(accessToken);
    await invalidateArena();
  };
}
```

This keeps the provider stable while letting future requests use the latest token.

## Query Keys

All query keys are available from `arenaQueryKeys` and are namespaced under `["arena"]`.

```ts
import { arenaQueryKeys } from "@aredotna/react-query";

queryClient.invalidateQueries({ queryKey: arenaQueryKeys.all });
queryClient.invalidateQueries({ queryKey: arenaQueryKeys.channels.detail("my-channel") });
```

## SSR

The hooks are plain TanStack Query hooks. For SSR, create `QueryClient` and `Arena` instances
per request, prefetch using TanStack Query, dehydrate on the server, and hydrate on the client.
Avoid sharing an authenticated `Arena` or `QueryClient` singleton across requests.
