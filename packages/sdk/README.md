# @aredotna/sdk

Official TypeScript SDK for the [Are.na API](https://www.are.na/developers/explore).

Are.na is a platform for connecting ideas and building knowledge. Users collect images,
text, links, files, and channels into collaborative knowledge networks.

## Install

```sh
pnpm add @aredotna/sdk
```

This package is ESM-only and requires Node 20+ or a modern browser/runtime with `fetch`.

## Quickstart

Public reads do not require authentication:

```ts
import { createArena } from "@aredotna/sdk";

const arena = createArena();
const channel = await arena.channels.get("arena-influences");
const firstPage = await arena.channels.contents(channel.slug, { per: 24 });
```

## Authentication

Most public data can be read without a token. Authenticated requests can see private content
you have access to and can create, update, or delete resources.

Use a personal access token from
[are.na/settings/personal-access-tokens](https://www.are.na/settings/personal-access-tokens):

```ts
const arena = createArena({
  token: process.env.ARENA_TOKEN,
});
```

You can also provide a lazy token getter, which is useful in React server components, server
actions, or API routes:

```ts
const arena = createArena({
  token: async () => session.accessToken,
});
```

## Core Concepts

Channels are collections of blocks and other channels. Blocks are pieces of content: text,
images, links, embeds, or attachments. Connections place a block or channel inside a channel.
Users and groups own content and can follow users, channels, and groups.

The SDK exposes these concepts as stable resource groups:

```ts
await arena.channels.get("my-channel");
await arena.blocks.get(123);
await arena.connections.create({
  connectable_id: 123,
  connectable_type: "Block",
  channel_ids: [456],
});
await arena.users.get("damonzucconi");
await arena.groups.get("some-group");
```

## Pagination

Are.na channels and users can contain thousands of items. Fetch pages lazily and stop when
you have enough:

```ts
for await (const page of arena.channels.paginateContents("arena-influences", { per: 50 })) {
  render(page.data);
  if (done) break;
}
```

The lower-level helper also works with generated operations from `@aredotna/sdk/api`.

## OAuth + PKCE

Register an OAuth application at
[are.na/oauth/applications](https://www.are.na/oauth/applications).

```ts
import { OAuth, generatePKCE, generateState } from "@aredotna/sdk/oauth";

const oauth = new OAuth({ clientId, redirectUri });
const pkce = await generatePKCE();
const state = generateState();

location.assign(
  oauth.authorizeUrl({
    codeChallenge: pkce.codeChallenge,
    scope: "write",
    state,
  }),
);

const token = await oauth.exchangeCode({
  code,
  codeVerifier: pkce.codeVerifier,
  expectedState: stateFromCookie,
  state: stateFromRedirect,
});
```

For confidential server-side clients:

```ts
const token = await oauth.exchangeCode({ code, clientSecret });
const appToken = await oauth.clientCredentials({ clientSecret });
```

## Uploads

The API upload flow is: presign with Are.na, PUT bytes to S3, then create a block with the
temporary S3 URL. The SDK provides a one-shot helper:

```ts
const block = await arena.uploads.createBlock({
  file,
  channels: [{ id: 123 }],
  block: {
    metadata: { title: "Reference image" },
  },
});
```

You can also upload without creating a block:

```ts
const uploaded = await arena.uploads.upload(file);
console.log(uploaded.url);
```

Upload progress is best-effort. Runtimes that cannot observe upload progress report start and
completion only.

## Errors And Rate Limits

The main SDK facade throws normalized errors:

```ts
import { ArenaApiError, ArenaRateLimitError } from "@aredotna/sdk";

try {
  await arena.channels.get("private-channel");
} catch (error) {
  if (error instanceof ArenaRateLimitError) {
    console.log(error.retryAfter);
  } else if (error instanceof ArenaApiError) {
    console.log(error.status, error.details);
  }
}
```

Rate-limit headers are captured on the Arena instance:

```ts
await arena.ping();
console.log(arena.rateLimit?.tier, arena.rateLimit?.limit);
```

Opt into automatic 429 retry:

```ts
const arena = createArena({
  retry: { respectRateLimits: true, maxRetries: 1 },
});
```

## React

This package does not ship hooks. Use the SDK with your data fetching library of choice:

```ts
import { useQuery } from "@tanstack/react-query";
import { createArena } from "@aredotna/sdk";

const arena = createArena();

function Channel({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["channel", id],
    queryFn: ({ signal }) => arena.channels.get(id, { signal }),
  });

  return <h1>{query.data?.title}</h1>;
}
```

## Raw Generated API

For complete OpenAPI-shaped access, import from `@aredotna/sdk/api`:

```ts
import { createClient, getChannel } from "@aredotna/sdk/api";

const client = createClient({ token });
const result = await getChannel({ client, path: { id: "arena-influences" } });

if (result.error) {
  console.error(result.error);
}
```

The raw API preserves Hey API's `{ data, error, response }` result-object style. The main
`@aredotna/sdk` facade is the stable ergonomic surface and throws normalized errors.

## Regenerating From OpenAPI

```sh
pnpm gen:fetch
pnpm gen
```

The source spec is [https://api.are.na/v3/openapi.json](https://api.are.na/v3/openapi.json).
The developer docs are available at [are.na/developers/explore](https://www.are.na/developers/explore).
