import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { VoteValue } from "../types/vote.types";
import type { Comment } from "@/features/comments/types/comment.types";
import type { FeedResponse, Post } from "@/features/posts/types/post.types";

export type VoteCacheItem = { id: string; score: number; myVote: VoteValue };
export type CacheSnapshot = Array<{ queryKey: readonly unknown[]; data: unknown }>;

export function patchMatching<T extends VoteCacheItem>(
  items: T[],
  targetId: string,
  update: (item: VoteCacheItem) => VoteCacheItem
): T[] {
  return items.map((item) =>
    item.id === targetId ? (update(item) as T) : item
  );
}

export function walkVoteCaches(
  queryClient: QueryClient,
  targetId: string,
  update: (item: VoteCacheItem) => VoteCacheItem
) {
  for (const query of queryClient.getQueryCache().getAll()) {
    const kind = query.queryKey[0];
    if (kind === "feed") {
      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        query.queryKey,
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  items: patchMatching(page.items, targetId, update),
                })),
              }
            : data
      );
    } else if (kind === "post") {
      queryClient.setQueryData<Post>(query.queryKey, (post) =>
        post && post.id === targetId ? (update(post) as Post) : post
      );
    } else if (kind === "comments") {
      queryClient.setQueryData<Comment[]>(query.queryKey, (comments) =>
        comments ? patchMatching(comments, targetId, update) : comments
      );
    }
  }
}

export function applyScorePatch(
  queryClient: QueryClient,
  targetId: string,
  score: number
) {
  walkVoteCaches(queryClient, targetId, (item) => ({ ...item, score }));
}

export function snapshotAll(queryClient: QueryClient): CacheSnapshot {
  return queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.data !== undefined)
    .map((query) => ({ queryKey: query.queryKey, data: query.state.data }));
}

export function restoreSnapshot(queryClient: QueryClient, snapshot: CacheSnapshot) {
  for (const entry of snapshot) {
    queryClient.setQueryData(entry.queryKey, entry.data);
  }
}
