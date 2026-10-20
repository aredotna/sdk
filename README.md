# Are.na SDK

This repository contains the official TypeScript SDK for the Are.na API.

Published packages:

- [`@aredotna/sdk`](packages/sdk): generated from the Are.na OpenAPI specification with a small ergonomic
  facade for OAuth, pagination, uploads, and error handling.
- [`@aredotna/react-query`](packages/react-query): TanStack Query hooks over the stable SDK facade.

## Development

```sh
corepack enable
pnpm install
pnpm gen:fetch
pnpm gen
pnpm test
pnpm build
```

The OpenAPI snapshot lives in `spec/openapi.json` so builds are reproducible offline.
After regenerating, review new operations for additions to the SDK resource facade, React Query
hooks, public exports, tests, and package documentation. Changes to existing request/response
types flow through the facade's generated type aliases automatically. Update the intentional
operation list in `packages/sdk/test/operation-exports.test.ts` when endpoints are added.

## Releases

This monorepo uses fixed versions: `@aredotna/sdk` and `@aredotna/react-query` always share
the same version, and releases are tagged as `vX.Y.Z`.

Release flow:

1. Label a PR with exactly one of `patch`, `minor`, or `major`.
2. Merge the PR into `main`.
3. The Release workflow bumps the root package and both package versions, commits
   `release: vX.Y.Z`, and pushes tag `vX.Y.Z`.
4. The Publish workflow runs from that tag, publishing `@aredotna/sdk` first and then
   `@aredotna/react-query`.
5. The Publish workflow creates a GitHub Release if one does not already exist.

Publishing authentication:

- Configure npm trusted publishing for both packages to allow this repository's `publish.yml`
  workflow. The workflow uses GitHub Actions OIDC; it does not read an `NPM_TOKEN` secret.
- `RELEASE_TOKEN` (optional): token used by the Release workflow so the release commit can
  re-trigger CI on `main`.

Local release checks:

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
node scripts/version-all.mjs patch --dry-run
pnpm -r --filter './packages/*' publish --dry-run
```

Do not publish manually unless recovering from a workflow failure.
