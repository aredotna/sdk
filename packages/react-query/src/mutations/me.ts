import type {
  MarkAllMyNotificationsReadResponse,
  MarkMyNotificationReadResponse,
} from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type MarkMyNotificationReadVariables = {
  id: number;
};

export type UseMarkMyNotificationReadOptions = ArenaMutationOptions<
  MarkMyNotificationReadResponse,
  MarkMyNotificationReadVariables
>;
export type UseMarkAllMyNotificationsReadOptions = ArenaMutationOptions<
  MarkAllMyNotificationsReadResponse,
  void
>;

export const useMarkMyNotificationRead = (options?: UseMarkMyNotificationReadOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.me.markNotificationRead(id),
  } satisfies {
    mutationFn: (
      variables: MarkMyNotificationReadVariables,
    ) => Promise<MarkMyNotificationReadResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useMarkAllMyNotificationsRead = (options?: UseMarkAllMyNotificationsReadOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: () => arena.me.markAllNotificationsRead(),
  } satisfies {
    mutationFn: () => Promise<MarkAllMyNotificationsReadResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
