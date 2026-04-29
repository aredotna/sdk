import type { ArenaClient } from "./client";
import { createBlock, presignUpload } from "./generated/sdk.gen";
import type { ConnectTo, CreateBlockData, PresignedFile } from "./generated/types.gen";
import { type RequestOverrides, data as readData, withClient } from "./resources/shared";

const TEMP_BUCKET_BASE_URL = "https://s3.amazonaws.com/arena_images-temp";

const toPresignFile = (file: { contentType: string; filename: string }) => ({
  content_type: file.contentType,
  filename: file.filename,
});

const encodeS3KeyForUrl = (key: string) => {
  const params = new URLSearchParams({ key });
  return params.toString().slice("key=".length);
};

export type UploadInput =
  | File
  | Blob
  | {
      contentType: string;
      data: ArrayBuffer | Uint8Array;
      filename: string;
    };

export interface UploadOptions extends RequestOverrides {
  contentType?: string;
  filename?: string;
  onProgress?: (sent: number, total?: number) => void;
}

export interface UploadedFile {
  contentType: string;
  key: string;
  uploadUrl: string;
  url: string;
}

export interface CreateUploadBlockOptions extends UploadOptions {
  block?: Partial<CreateBlockData["body"]>;
  channels: Array<ConnectTo>;
  file: UploadInput;
}

export const createUploadsResource = ({ client }: { client: ArenaClient }) => ({
  presign: async (
    files: Array<{ contentType: string; filename: string }>,
    options?: RequestOverrides,
  ) =>
    readData(
      presignUpload(
        withClient(
          client,
          {
            body: {
              files: files.map(toPresignFile),
            },
          },
          options,
        ),
      ),
    ),

  upload: (file: UploadInput, options?: UploadOptions) => uploadOne(client, file, options),

  uploadMany: async (files: Array<UploadInput>, options?: UploadOptions) => {
    const normalized = await Promise.all(files.map((file) => normalizeUploadInput(file, options)));
    const presigned = await readData(
      presignUpload(
        withClient(client, {
          body: {
            files: normalized.map(toPresignFile),
          },
        }),
      ),
    );

    return Promise.all(
      presigned.files.map((presignedFile, index) => {
        const file = normalized[index];
        if (!file) {
          throw new Error("Missing normalized upload input.");
        }
        return putPresignedFile(file, presignedFile, options);
      }),
    );
  },

  createBlock: async ({ block, channels, file, ...options }: CreateUploadBlockOptions) => {
    const uploaded = await uploadOne(client, file, options);
    return readData(
      createBlock(
        withClient(client, {
          body: {
            ...block,
            channels,
            value: uploaded.url,
          } as CreateBlockData["body"],
        }),
      ),
    );
  },
});

export type UploadsResource = ReturnType<typeof createUploadsResource>;

const uploadOne = async (
  client: ArenaClient,
  input: UploadInput,
  options?: UploadOptions,
): Promise<UploadedFile> => {
  const file = await normalizeUploadInput(input, options);
  const presigned = await readData(
    presignUpload(
      withClient(
        client,
        {
          body: {
            files: [toPresignFile(file)],
          },
        },
        options,
      ),
    ),
  );

  const presignedFile = presigned.files[0];
  if (!presignedFile) {
    throw new Error("Are.na did not return a presigned upload URL.");
  }

  return putPresignedFile(file, presignedFile, options);
};

const putPresignedFile = async (
  file: NormalizedUploadInput,
  presignedFile: PresignedFile,
  options?: UploadOptions,
): Promise<UploadedFile> => {
  await uploadPresignedFile(file, presignedFile, options);

  return {
    contentType: presignedFile.content_type,
    key: presignedFile.key,
    uploadUrl: presignedFile.upload_url,
    url: `${TEMP_BUCKET_BASE_URL}/${encodeS3KeyForUrl(presignedFile.key)}`,
  };
};

const uploadPresignedFile = (
  file: NormalizedUploadInput,
  presignedFile: PresignedFile,
  options?: UploadOptions,
) => {
  if (options?.onProgress && typeof XMLHttpRequest !== "undefined") {
    return uploadWithXhr(file, presignedFile, options);
  }

  return uploadWithFetch(file, presignedFile, options);
};

const uploadWithFetch = async (
  file: NormalizedUploadInput,
  presignedFile: PresignedFile,
  options?: UploadOptions,
) => {
  options?.onProgress?.(0, file.size);

  const requestInit: RequestInit = {
    body: file.body,
    headers: {
      "Content-Type": presignedFile.content_type,
    },
    method: "PUT",
  };

  if (options?.signal) {
    requestInit.signal = options.signal;
  }

  const response = await fetch(presignedFile.upload_url, requestInit);

  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}.`);
  }

  options?.onProgress?.(file.size ?? 1, file.size);
};

const uploadWithXhr = (
  file: NormalizedUploadInput,
  presignedFile: PresignedFile,
  options: UploadOptions,
) =>
  new Promise<void>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const xhr = new XMLHttpRequest();
    let lastProgress: { sent: number; total?: number } | undefined;
    let settled = false;

    const emitProgress = (sent: number, total?: number) => {
      if (lastProgress?.sent === sent && lastProgress.total === total) {
        return;
      }

      lastProgress = { sent, total };
      options.onProgress?.(sent, total);
    };

    const cleanup = () => {
      options.signal?.removeEventListener("abort", abortUpload);
    };

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const abortUpload = () => {
      xhr.abort();
    };

    options.signal?.addEventListener("abort", abortUpload, { once: true });

    xhr.upload.onprogress = (event) => {
      emitProgress(event.loaded, event.lengthComputable ? event.total : file.size);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        settle(() => {
          emitProgress(file.size ?? 1, file.size);
          resolve();
        });
        return;
      }

      settle(() => {
        reject(new Error(`S3 upload failed with status ${xhr.status}.`));
      });
    };

    xhr.onerror = () => {
      settle(() => {
        reject(new Error("Network error during S3 upload."));
      });
    };

    xhr.onabort = () => {
      settle(() => {
        reject(createAbortError());
      });
    };

    xhr.open("PUT", presignedFile.upload_url);
    xhr.setRequestHeader("Content-Type", presignedFile.content_type);
    emitProgress(0, file.size);
    xhr.send(file.body);
  });

const createAbortError = () => {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }

  return new Error("The operation was aborted.");
};

interface NormalizedUploadInput {
  body: Blob | ArrayBuffer;
  contentType: string;
  filename: string;
  size?: number;
}

const normalizeUploadInput = async (
  input: UploadInput,
  options?: UploadOptions,
): Promise<NormalizedUploadInput> => {
  if (typeof File !== "undefined" && input instanceof File) {
    return {
      body: input,
      contentType: options?.contentType ?? input.type ?? "application/octet-stream",
      filename: options?.filename ?? input.name,
      size: input.size,
    };
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return {
      body: input,
      contentType: options?.contentType ?? input.type ?? "application/octet-stream",
      filename: options?.filename ?? "upload",
      size: input.size,
    };
  }

  if (!isBytesUploadInput(input)) {
    throw new Error("Unsupported upload input.");
  }

  const bytes = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return {
    body,
    contentType: options?.contentType ?? input.contentType,
    filename: options?.filename ?? input.filename,
    size: bytes.byteLength,
  };
};

const isBytesUploadInput = (
  input: UploadInput,
): input is Extract<UploadInput, { data: ArrayBuffer | Uint8Array }> =>
  typeof input === "object" && "data" in input && "filename" in input && "contentType" in input;
