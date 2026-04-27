# Are.na SDK

This repository contains the official TypeScript SDK for the Are.na API.

The published package is `@aredotna/sdk`. It is generated from the Are.na OpenAPI
specification and layers a small ergonomic facade on top for common workflows like OAuth,
pagination, uploads, and error handling.

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
