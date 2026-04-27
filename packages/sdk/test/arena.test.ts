import { describe, expect, it } from "vitest";
import { ArenaNotFoundError, createArena } from "../src";

describe("createArena", () => {
  it("binds the stable channel facade to the generated client", async () => {
    const calls: Array<Request> = [];
    const arena = createArena({
      fetch: async (request) => {
        const req = request instanceof Request ? request : new Request(request);
        calls.push(req);
        return json({ id: 1, title: "Arena Influences", type: "Channel" });
      },
      token: "token",
    });

    const channel = await arena.channels.get("arena-influences");

    expect(channel).toMatchObject({ title: "Arena Influences" });
    expect(calls[0]?.url).toBe("https://api.are.na/v3/channels/arena-influences");
    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer token");
  });

  it("throws normalized errors from the facade", async () => {
    const arena = createArena({
      fetch: async () =>
        json(
          {
            code: 404,
            details: { message: "The resource you requested does not exist" },
            error: "Not Found",
          },
          { status: 404, statusText: "Not Found" },
        ),
    });

    await expect(arena.channels.get("missing")).rejects.toBeInstanceOf(ArenaNotFoundError);
  });
});

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
