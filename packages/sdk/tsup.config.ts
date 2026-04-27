import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    api: "src/api.ts",
    oauth: "src/oauth.ts",
  },
  format: ["esm"],
  minify: false,
  sourcemap: false,
  splitting: true,
  target: "es2022",
  treeshake: true,
});
