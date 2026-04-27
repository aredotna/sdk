import { describe, expect, it, vi } from "vitest";
import { createArena } from "../src";

describe("uploads", () => {
  it("presigns, uploads to S3, and returns the temporary file URL", async () => {
    const apiFetch = vi.fn(async () =>
      json(
        {
          expires_in: 3600,
          files: [
            {
              content_type: "text/plain",
              key: "uploads/test.txt",
              upload_url: "https://s3.example/upload",
            },
          ],
        },
        { status: 201 },
      ),
    );
    const originalFetch = globalThis.fetch;
    const s3Fetch = vi.fn(async () => new Response(null, { status: 200 }));
    globalThis.fetch = s3Fetch as typeof fetch;

    try {
      const arena = createArena({ fetch: apiFetch });
      const progress = vi.fn();
      const uploaded = await arena.uploads.upload(
        {
          contentType: "text/plain",
          data: new TextEncoder().encode("hello"),
          filename: "test.txt",
        },
        { onProgress: progress },
      );

      expect(uploaded.url).toBe("https://s3.amazonaws.com/arena_images-temp/uploads/test.txt");
      expect(s3Fetch).toHaveBeenCalledWith(
        "https://s3.example/upload",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(progress).toHaveBeenCalledWith(0, 5);
      expect(progress).toHaveBeenCalledWith(5, 5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
