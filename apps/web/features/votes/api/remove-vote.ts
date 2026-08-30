import { apiClient } from "@/shared/api/api-client";
import type { RemoveVoteInput, VoteState } from "../types/vote.types";

export function removeVote(input: RemoveVoteInput): Promise<VoteState> {
  return apiClient.delete<VoteState>("/api/votes", input);
}
