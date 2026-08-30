import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { joinNest } from "../api/join-nest";
import type { Nest } from "../types/nest.types";
import { nestKeys } from "./nest-keys";
import { restoreSnapshot, snapshotAll } from "@/features/votes/hooks/vote-cache";

export function patchNestMembership(
  queryClient: QueryClient,
  slug: string,
  delta: number
) {
  queryClient.setQueryData<Nest>(nestKeys.detail(slug), (nest) =>
    nest ? { ...nest, memberCount: Math.max(0, nest.memberCount + delta) } : nest
  );
  queryClient.setQueryData<Nest[]>(nestKeys.all, (nests) =>
    nests?.map((nest) =>
      nest.slug === slug
        ? { ...nest, memberCount: Math.max(0, nest.memberCount + delta) }
        : nest
    )
  );
}

export function useJoinNest(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => joinNest(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: nestKeys.detail(slug) });
      const snapshot = snapshotAll(queryClient);
      patchNestMembership(queryClient, slug, 1);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) restoreSnapshot(queryClient, context.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: nestKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: nestKeys.all });
    },
  });
}
