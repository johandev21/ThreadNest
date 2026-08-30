import { apiClient } from "@/shared/api/api-client";
import type { VoteInput, VoteState } from "../types/vote.types";

export function vote(input: VoteInput): Promise<VoteState> {
  return apiClient.put<VoteState>("/api/votes", input);
}
