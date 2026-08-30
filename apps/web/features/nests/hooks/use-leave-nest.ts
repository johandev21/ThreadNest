import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveNest } from "../api/leave-nest";
import { nestKeys } from "./nest-keys";
import { patchNestMembership } from "./use-join-nest";
import { restoreSnapshot, snapshotAll } from "@/features/votes/hooks/vote-cache";

export function useLeaveNest(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveNest(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: nestKeys.detail(slug) });
      const snapshot = snapshotAll(queryClient);
      patchNestMembership(queryClient, slug, -1);
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
