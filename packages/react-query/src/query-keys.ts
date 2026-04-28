export const arenaQueryKeys = {
  all: ["arena"] as const,
  blocks: {
    all: () => [...arenaQueryKeys.all, "blocks"] as const,
    batchStatus: (batchId: string) => [...arenaQueryKeys.blocks.all(), "batch", batchId] as const,
    comments: (id: number, query?: unknown) =>
      [...arenaQueryKeys.blocks.detail(id), "comments", query ?? {}] as const,
    commentsInfinite: (id: number, query?: unknown) =>
      [...arenaQueryKeys.blocks.detail(id), "comments", "infinite", query ?? {}] as const,
    connections: (id: number, query?: unknown) =>
      [...arenaQueryKeys.blocks.detail(id), "connections", query ?? {}] as const,
    connectionsInfinite: (id: number, query?: unknown) =>
      [...arenaQueryKeys.blocks.detail(id), "connections", "infinite", query ?? {}] as const,
    detail: (id: number) => [...arenaQueryKeys.blocks.all(), id] as const,
  },
  channels: {
    all: () => [...arenaQueryKeys.all, "channels"] as const,
    connections: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.channels.detail(id), "connections", query ?? {}] as const,
    contents: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.channels.detail(id), "contents", query ?? {}] as const,
    contentsInfinite: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.channels.detail(id), "contents", "infinite", query ?? {}] as const,
    detail: (id: string | number) => [...arenaQueryKeys.channels.all(), String(id)] as const,
    followers: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.channels.detail(id), "followers", query ?? {}] as const,
  },
  connections: {
    all: () => [...arenaQueryKeys.all, "connections"] as const,
    detail: (id: number) => [...arenaQueryKeys.connections.all(), id] as const,
  },
  groups: {
    all: () => [...arenaQueryKeys.all, "groups"] as const,
    contents: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.groups.detail(id), "contents", query ?? {}] as const,
    contentsInfinite: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.groups.detail(id), "contents", "infinite", query ?? {}] as const,
    detail: (id: string | number) => [...arenaQueryKeys.groups.all(), String(id)] as const,
    followers: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.groups.detail(id), "followers", query ?? {}] as const,
  },
  me: () => [...arenaQueryKeys.all, "me"] as const,
  ping: () => [...arenaQueryKeys.all, "ping"] as const,
  search: (query?: unknown) => [...arenaQueryKeys.all, "search", query ?? {}] as const,
  searchInfinite: (query?: unknown) =>
    [...arenaQueryKeys.all, "search", "infinite", query ?? {}] as const,
  users: {
    all: () => [...arenaQueryKeys.all, "users"] as const,
    contents: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.users.detail(id), "contents", query ?? {}] as const,
    contentsInfinite: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.users.detail(id), "contents", "infinite", query ?? {}] as const,
    detail: (id: string | number) => [...arenaQueryKeys.users.all(), String(id)] as const,
    followers: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.users.detail(id), "followers", query ?? {}] as const,
    following: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.users.detail(id), "following", query ?? {}] as const,
    groups: (id: string | number, query?: unknown) =>
      [...arenaQueryKeys.users.detail(id), "groups", query ?? {}] as const,
  },
};
