import { describe, expect, it } from "vitest";
import { createArena } from "../src";

const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string> } })
  .process?.env;
const runLive = env?.ARENA_LIVE_TESTS === "1" ? describe : describe.skip;

runLive("live smoke", () => {
  it("pings the Are.na API", async () => {
    const arena = createArena();
    const response = await arena.ping();

    expect(response).toBeTruthy();
  });
});
