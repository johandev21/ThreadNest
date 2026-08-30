import type { VoteValue } from "@/features/votes/types/vote.types";

export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  score: number;
  myVote: VoteValue;
};

export type CreateCommentInput = {
  content: string;
  parentId?: string;
};
