import { describe, expect, it } from "vitest";
import { ArenaNotFoundError, createArena, type GroupMembershipRole } from "../src";

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

  it("updates a group member's role with authentication and request overrides", async () => {
    const calls: Request[] = [];
    const controller = new AbortController();
    const role: GroupMembershipRole = "viewer";
    const arena = createArena({
      fetch: async (input) => {
        const request = new Request(input);
        calls.push(request);
        return json({ id: 42, role, username: "member" });
      },
      token: "token",
    });

    const member = await arena.groups.updateMember(
      123,
      42,
      { role },
      { headers: { "X-Request-ID": "role-update" }, signal: controller.signal },
    );

    expect(member).toMatchObject({ id: 42, role, username: "member" });
    const request = calls[0]!;
    expect(request.url).toBe("https://api.are.na/v3/groups/123/members/42");
    expect(request.method).toBe("PATCH");
    expect(request.headers.get("Authorization")).toBe("Bearer token");
    expect(request.headers.get("X-Request-ID")).toBe("role-update");
    expect(await request.json()).toEqual({ role });
    controller.abort();
    expect(request.signal.aborted).toBe(true);
  });

  it("passes group default roles and block covers through to the API", async () => {
    const bodies: unknown[] = [];
    const arena = createArena({
      fetch: async (input) => {
        bodies.push(await new Request(input).json());
        return json({ id: 1 });
      },
    });

    await arena.groups.create({ name: "Studio", default_role: "viewer" });
    await arena.groups.update("studio", { default_role: "admin" });
    const block = { value: "https://example.com", cover_url: "https://example.com/cover.jpg" };
    await arena.blocks.create({ ...block, channels: [{ id: 1 }] });
    await arena.blocks.batchCreate({ blocks: [block], channel_ids: [1] });

    expect(bodies).toEqual([
      { name: "Studio", default_role: "viewer" },
      { default_role: "admin" },
      { ...block, channels: [{ id: 1 }] },
      { blocks: [block], channel_ids: [1] },
    ]);
  });

  it("binds expanded groups and me endpoints", async () => {
    const calls: Array<Request> = [];
    const arena = createArena({
      fetch: async (request) => {
        const req = request instanceof Request ? request : new Request(request);
        calls.push(req);
        return json({
          data: [],
          id: 1,
          meta: { has_more: false, next_cursor: null, prev_cursor: null },
          type: "Group",
        });
      },
      token: "token",
    });

    await arena.groups.create({ name: "Studio" });
    await arena.groups.join("studio", { invite_token: "invite-token" });
    await arena.groups.removeMember("studio", 42);
    await arena.me.feed({ limit: 10 });
    await arena.me.markNotificationRead(123);

    expect(calls.map((request) => request.method)).toEqual([
      "POST",
      "POST",
      "DELETE",
      "GET",
      "POST",
    ]);
    expect(calls.map((request) => request.url)).toEqual([
      "https://api.are.na/v3/groups",
      "https://api.are.na/v3/groups/studio/members",
      "https://api.are.na/v3/groups/studio/members/42",
      "https://api.are.na/v3/me/feed?limit=10",
      "https://api.are.na/v3/me/notifications/123/read",
    ]);
    expect(calls.every((request) => request.headers.get("Authorization") === "Bearer token")).toBe(
      true,
    );
  });
});

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
