import type { VoteValue } from "../types/vote.types";

export function getNextVoteValue(
  currentVote: VoteValue,
  clickedValue: Exclude<VoteValue, 0>
): VoteValue {
  return currentVote === clickedValue ? 0 : clickedValue;
}

export function calculateVoteDelta(
  currentVote: VoteValue,
  newVote: VoteValue
): number {
  return newVote - currentVote;
}
