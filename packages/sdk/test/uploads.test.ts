import { describe, expect, it, vi } from "vitest";
import { createArena } from "../src";

describe("uploads", () => {
  it("presigns, uploads to S3, and returns the temporary file URL", async () => {
    const filename = "Image Apr 28, 2026, 06_13_47 PM.png";
    const apiFetch = vi.fn<typeof fetch>(async (input) => {
      const request = asRequest(input);
      await expect(request.json()).resolves.toEqual({
        files: [
          {
            content_type: "text/plain",
            filename,
          },
        ],
      });

      return json(
        {
          expires_in: 3600,
          files: [
            {
              content_type: "text/plain",
              key: `uploads/cd4890dc-0d17-48e4-a9f0-a7295e98c8ac/${filename}`,
              upload_url: "https://s3.example/upload",
            },
          ],
        },
        { status: 201 },
      );
    });
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
          filename,
        },
        { onProgress: progress },
      );

      expect(uploaded.url).toBe(
        "https://s3.amazonaws.com/arena_images-temp/uploads%2Fcd4890dc-0d17-48e4-a9f0-a7295e98c8ac%2FImage+Apr+28%2C+2026%2C+06_13_47+PM.png",
      );
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

  it("sends raw filenames when presigning directly", async () => {
    const apiFetch = vi.fn<typeof fetch>(async (input) => {
      const request = asRequest(input);
      await expect(request.json()).resolves.toEqual({
        files: [
          {
            content_type: "image/jpeg",
            filename: "photo 1/cover.jpg",
          },
        ],
      });

      return json(
        {
          expires_in: 3600,
          files: [
            {
              content_type: "image/jpeg",
              key: "uploads/photo 1/cover.jpg",
              upload_url: "https://s3.example/upload",
            },
          ],
        },
        { status: 201 },
      );
    });

    const arena = createArena({ fetch: apiFetch });

    await arena.uploads.presign([{ contentType: "image/jpeg", filename: "photo 1/cover.jpg" }]);
  });
});

const asRequest = (input: RequestInfo | URL) => {
  if (input instanceof Request) {
    return input;
  }

  return new Request(input);
};

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
