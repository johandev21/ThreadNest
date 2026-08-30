export type VoteValue = -1 | 0 | 1;
export type VoteTargetType = "post" | "comment";

export type VoteState = {
  score: number;
  myVote: VoteValue;
};

export type VoteInput = {
  targetType: VoteTargetType;
  targetId: string;
  value: Exclude<VoteValue, 0>;
};

export type RemoveVoteInput = {
  targetType: VoteTargetType;
  targetId: string;
};

export type VoteVariables = {
  targetType: VoteTargetType;
  targetId: string;
  myVote: VoteValue;
};
