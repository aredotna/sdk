import type {
  Arena,
  CreateUploadBlockOptions,
  UploadedFile,
  UploadInput,
  UploadOptions,
} from "@aredotna/sdk";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type UploadVariables = {
  file: UploadInput;
  options?: UploadOptions;
};

type UploadManyVariables = {
  files: Array<UploadInput>;
  options?: UploadOptions;
};

type CreateUploadBlockVariables = CreateUploadBlockOptions;
type CreateUploadBlockResult = Awaited<ReturnType<Arena["uploads"]["createBlock"]>>;

export type UseUploadOptions = ArenaMutationOptions<UploadedFile, UploadVariables>;
export type UseUploadManyOptions = ArenaMutationOptions<Array<UploadedFile>, UploadManyVariables>;
export type UseCreateUploadBlockOptions = ArenaMutationOptions<
  CreateUploadBlockResult,
  CreateUploadBlockVariables
>;

export const useUpload = (options?: UseUploadOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ file, options }) => arena.uploads.upload(file, options),
  } satisfies {
    mutationFn: (variables: UploadVariables) => Promise<UploadedFile>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useUploadMany = (options?: UseUploadManyOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: ({ files, options }) => arena.uploads.uploadMany(files, options),
  } satisfies {
    mutationFn: (variables: UploadManyVariables) => Promise<Array<UploadedFile>>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useCreateUploadBlock = (options?: UseCreateUploadBlockOptions) => {
  const arena = useArena();
  const mutation = {
    mutationFn: (input) => arena.uploads.createBlock(input),
  } satisfies {
    mutationFn: (input: CreateUploadBlockVariables) => Promise<CreateUploadBlockResult>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
