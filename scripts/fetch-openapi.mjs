import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SPEC_URL = "https://api.are.na/v3/openapi.json";
const outputPath = resolve("spec/openapi.json");

const response = await fetch(SPEC_URL, {
  headers: {
    accept: "application/json",
    "user-agent": "@aredotna/sdk-openapi-fetcher",
  },
});

if (!response.ok) {
  throw new Error(`Failed to fetch ${SPEC_URL}: ${response.status} ${response.statusText}`);
}

const spec = await response.json();

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
