import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  entry: {
    index: "src/index.ts",
  },
  external: ["@aredotna/sdk", "@tanstack/react-query", "react", "react-dom"],
  format: ["esm"],
  minify: false,
  sourcemap: false,
  splitting: true,
  target: "es2022",
  treeshake: true,
});
