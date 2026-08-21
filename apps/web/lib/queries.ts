import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import {
  api,
  type Comment,
  type FeedResponse,
  type Nest,
  type Post,
  type Sort,
  type VoteTargetType,
  type VoteValue,
} from "@/lib/api";

export const qk = {
  nests: ["nests"] as const,
  nest: (slug: string) => ["nest", slug] as const,
  feed: (sort: Sort, nest?: string) => ["feed", sort, nest ?? null] as const,
  post: (id: string) => ["post", id] as const,
  comments: (postId: string) => ["comments", postId] as const,
};

type VoteCacheItem = { id: string; score: number; myVote: VoteValue };
type CacheSnapshot = Array<{ queryKey: readonly unknown[]; data: unknown }>;

function patchMatching<T extends VoteCacheItem>(
  items: T[],
  targetId: string,
  update: (item: VoteCacheItem) => VoteCacheItem
): T[] {
  return items.map((item) =>
    item.id === targetId ? (update(item) as T) : item
  );
}

function walkVoteCaches(
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

function snapshotAll(queryClient: QueryClient): CacheSnapshot {
  return queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.data !== undefined)
    .map((query) => ({ queryKey: query.queryKey, data: query.state.data }));
}

function restoreSnapshot(queryClient: QueryClient, snapshot: CacheSnapshot) {
  for (const entry of snapshot) {
    queryClient.setQueryData(entry.queryKey, entry.data);
  }
}

export function useNests() {
  return useQuery({
    queryKey: qk.nests,
    queryFn: () => api.listNests(),
  });
}

export function useNest(slug: string) {
  return useQuery({
    queryKey: qk.nest(slug),
    queryFn: () => api.getNest(slug),
  });
}

export function useCreateNest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; title: string; description: string }) =>
      api.createNest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.nests });
    },
  });
}

function membershipPatch(
  queryClient: QueryClient,
  slug: string,
  delta: number
) {
  queryClient.setQueryData<Nest>(qk.nest(slug), (nest) =>
    nest ? { ...nest, memberCount: Math.max(0, nest.memberCount + delta) } : nest
  );
  queryClient.setQueryData<Nest[]>(qk.nests, (nests) =>
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
    mutationFn: () => api.joinNest(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qk.nest(slug) });
      const snapshot = snapshotAll(queryClient);
      membershipPatch(queryClient, slug, 1);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) restoreSnapshot(queryClient, context.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.nest(slug) });
      queryClient.invalidateQueries({ queryKey: qk.nests });
    },
  });
}

export function useLeaveNest(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.leaveNest(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qk.nest(slug) });
      const snapshot = snapshotAll(queryClient);
      membershipPatch(queryClient, slug, -1);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) restoreSnapshot(queryClient, context.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.nest(slug) });
      queryClient.invalidateQueries({ queryKey: qk.nests });
    },
  });
}

export function useFeed(sort: Sort, nest?: string) {
  return useInfiniteQuery({
    queryKey: qk.feed(sort, nest),
    queryFn: ({ pageParam }) =>
      api.listPosts({ sort, nest, cursor: pageParam, limit: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: qk.post(id),
    queryFn: () => api.getPost(id),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      nestSlug: string;
      type: Post["type"];
      title: string;
      content?: string;
      url?: string;
    }) => api.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: qk.nests });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: qk.post(id) });
      queryClient.removeQueries({ queryKey: qk.comments(id) });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: qk.nests });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: qk.comments(postId),
    queryFn: () => api.listComments(postId),
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; parentId?: string }) =>
      api.createComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments(postId) });
      queryClient.invalidateQueries({ queryKey: qk.post(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments(postId) });
      queryClient.invalidateQueries({ queryKey: qk.post(postId) });
    },
  });
}

export type VoteVariables = {
  targetType: VoteTargetType;
  targetId: string;
  myVote: VoteValue;
};

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: VoteVariables) =>
      variables.myVote === 0
        ? api.removeVote({
            targetType: variables.targetType,
            targetId: variables.targetId,
          })
        : api.vote({
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
          score: item.score + (variables.myVote - item.myVote),
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
        queryClient.invalidateQueries({ queryKey: qk.post(variables.targetId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      }
    },
  });
}
