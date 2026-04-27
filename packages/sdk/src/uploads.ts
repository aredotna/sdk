import type { ArenaClient } from "./client";
import { createBlock, presignUpload } from "./generated/sdk.gen";
import type { ConnectTo, CreateBlockData, PresignedFile } from "./generated/types.gen";
import { type RequestOverrides, data as readData, withClient } from "./resources/shared";

const TEMP_BUCKET_BASE_URL = "https://s3.amazonaws.com/arena_images-temp";

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
              files: files.map((file) => ({
                content_type: file.contentType,
                filename: file.filename,
              })),
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
            files: normalized.map((file) => ({
              content_type: file.contentType,
              filename: file.filename,
            })),
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
            files: [
              {
                content_type: file.contentType,
                filename: file.filename,
              },
            ],
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

  return {
    contentType: presignedFile.content_type,
    key: presignedFile.key,
    uploadUrl: presignedFile.upload_url,
    url: `${TEMP_BUCKET_BASE_URL}/${presignedFile.key}`,
  };
};

interface NormalizedUploadInput {
  body: BodyInit;
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

  const body = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
  return {
    body: body as unknown as BodyInit,
    contentType: options?.contentType ?? input.contentType,
    filename: options?.filename ?? input.filename,
    size: body.byteLength,
  };
};

const isBytesUploadInput = (
  input: UploadInput,
): input is Extract<UploadInput, { data: ArrayBuffer | Uint8Array }> =>
  typeof input === "object" && "data" in input && "filename" in input && "contentType" in input;
