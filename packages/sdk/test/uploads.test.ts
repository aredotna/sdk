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

  it("uses browser XHR upload progress when available", async () => {
    const apiFetch = vi.fn<typeof fetch>(async () =>
      json(
        {
          expires_in: 3600,
          files: [
            {
              content_type: "text/plain",
              key: "uploads/file.txt",
              upload_url: "https://s3.example/upload",
            },
          ],
        },
        { status: 201 },
      ),
    );
    const originalXhr = globalThis.XMLHttpRequest;
    const xhrInstances: MockXMLHttpRequest[] = [];

    class MockXMLHttpRequest {
      headers: Record<string, string> = {};
      method?: string;
      onabort: ((event: ProgressEvent<EventTarget>) => void) | null = null;
      onerror: ((event: ProgressEvent<EventTarget>) => void) | null = null;
      onload: ((event: ProgressEvent<EventTarget>) => void) | null = null;
      status = 0;
      upload = {
        onprogress: null as ((event: ProgressEvent<EventTarget>) => void) | null,
      };
      url?: string;

      constructor() {
        xhrInstances.push(this);
      }

      abort = vi.fn();
      open = vi.fn((method: string, url: string) => {
        this.method = method;
        this.url = url;
      });
      send = vi.fn((body: Blob | BufferSource | null) => {
        expect(body).toBeInstanceOf(ArrayBuffer);

        this.upload.onprogress?.(progressEvent(2, 5));
        this.upload.onprogress?.(progressEvent(5, 5));
        this.status = 200;
        this.onload?.(progressEvent(5, 5));
      });
      setRequestHeader = vi.fn((name: string, value: string) => {
        this.headers[name] = value;
      });
    }

    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;

    try {
      const arena = createArena({ fetch: apiFetch });
      const progress = vi.fn();

      await arena.uploads.upload(
        {
          contentType: "text/plain",
          data: new TextEncoder().encode("hello"),
          filename: "file.txt",
        },
        { onProgress: progress },
      );

      expect(xhrInstances).toHaveLength(1);
      expect(xhrInstances[0]?.method).toBe("PUT");
      expect(xhrInstances[0]?.url).toBe("https://s3.example/upload");
      expect(xhrInstances[0]?.headers).toEqual({ "Content-Type": "text/plain" });
      expect(progress).toHaveBeenNthCalledWith(1, 0, 5);
      expect(progress).toHaveBeenNthCalledWith(2, 2, 5);
      expect(progress).toHaveBeenNthCalledWith(3, 5, 5);
    } finally {
      globalThis.XMLHttpRequest = originalXhr;
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

const progressEvent = (loaded: number, total: number) =>
  ({
    lengthComputable: true,
    loaded,
    total,
  }) as ProgressEvent<EventTarget>;

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
