import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../spec/openapi.json",
  output: {
    path: "src/generated",
  },
  plugins: [
    "@hey-api/client-fetch",
    {
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    {
      name: "@hey-api/sdk",
      operations: {
        strategy: "flat",
      },
    },
  ],
});
