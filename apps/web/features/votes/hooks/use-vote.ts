import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vote } from "../api/vote";
import { removeVote } from "../api/remove-vote";
import type { VoteVariables } from "../types/vote.types";
import {
  applyScorePatch,
  restoreSnapshot,
  snapshotAll,
  walkVoteCaches,
  type VoteCacheItem,
} from "./vote-cache";
import { calculateVoteDelta } from "../utils/calculate-vote-delta";

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: VoteVariables) =>
      variables.myVote === 0
        ? removeVote({
            targetType: variables.targetType,
            targetId: variables.targetId,
          })
        : vote({
            targetType: variables.targetType,
            targetId: variables.targetId,
            value: variables.myVote,
          }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries();
      const snapshot = snapshotAll(queryClient);
      walkVoteCaches(
        queryClient,
        variables.targetId,
        (item: VoteCacheItem): VoteCacheItem => ({
          ...item,
          score: item.score + calculateVoteDelta(item.myVote, variables.myVote),
          myVote: variables.myVote,
        })
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) restoreSnapshot(queryClient, context.snapshot);
    },
    onSuccess: (state, variables) => {
      applyScorePatch(queryClient, variables.targetId, state.score);
    },
    onSettled: (_state, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      if (variables.targetType === "post") {
        queryClient.invalidateQueries({ queryKey: ["post", variables.targetId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      }
    },
  });
}
