import {
  type QueryKey,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { arenaQueryKeys } from "../query-keys";

export interface ArenaMutationOptions<TData, TVariables, TContext = unknown>
  extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn"> {
  invalidate?: false | QueryKey;
}

export const useArenaMutation = <TData, TVariables, TContext = unknown>({
  invalidate = arenaQueryKeys.all,
  mutationFn,
  options,
}: {
  invalidate?: false | QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  options?: ArenaMutationOptions<TData, TVariables, TContext>;
}) => {
  const queryClient = useQueryClient();
  const { invalidate: optionsInvalidate, onSuccess, ...mutationOptions } = options ?? {};
  const invalidateKey = optionsInvalidate ?? invalidate;

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (invalidateKey !== false) {
        await queryClient.invalidateQueries({ queryKey: invalidateKey });
      }

      await onSuccess?.(data, variables, onMutateResult, context);
    },
    ...mutationOptions,
  });
};
