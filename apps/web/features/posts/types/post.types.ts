import type { VoteValue } from "@/features/votes/types/vote.types";

export type Sort = "hot" | "new" | "top";
export type PostType = "text" | "link";

export type Post = {
  id: string;
  type: PostType;
  title: string;
  content: string | null;
  url: string | null;
  createdAt: string;
  nestId: string;
  nestSlug: string;
  nestTitle: string;
  authorId: string;
  authorName: string;
  score: number;
  commentCount: number;
  myVote: VoteValue;
};

export type FeedResponse = {
  items: Post[];
  nextCursor: number | null;
};

export type ListPostsParams = {
  sort?: Sort;
  nest?: string;
  cursor?: number;
  limit?: number;
};

export type CreatePostInput = {
  nestSlug: string;
  type: PostType;
  title: string;
  content?: string;
  url?: string;
};
