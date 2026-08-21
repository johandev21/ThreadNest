export type Sort = "hot" | "new" | "top";
export type PostType = "text" | "link";
export type VoteValue = -1 | 0 | 1;
export type VoteTargetType = "post" | "comment";

export type Nest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  creatorId: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
};

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

export type FeedResponse = { items: Post[]; nextCursor: number | null };
export type VoteState = { score: number; myVote: VoteValue };
export type MembershipState = { joined: boolean };

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {}
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  listNests() {
    return request<Nest[]>("/api/nests");
  },
  createNest(input: { slug: string; title: string; description: string }) {
    return request<Nest>("/api/nests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getNest(slug: string) {
    return request<Nest>(`/api/nests/${encodeURIComponent(slug)}`);
  },
  joinNest(slug: string) {
    return request<MembershipState>(`/api/nests/${encodeURIComponent(slug)}/membership`, {
      method: "PUT",
    });
  },
  leaveNest(slug: string) {
    return request<MembershipState>(`/api/nests/${encodeURIComponent(slug)}/membership`, {
      method: "DELETE",
    });
  },
  listPosts(params: {
    sort?: Sort;
    nest?: string;
    cursor?: number;
    limit?: number;
  }) {
    const search = new URLSearchParams();
    if (params.sort) search.set("sort", params.sort);
    if (params.nest) search.set("nest", params.nest);
    if (params.cursor !== undefined) search.set("cursor", String(params.cursor));
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    const qs = search.toString();
    return request<FeedResponse>(`/api/posts${qs ? `?${qs}` : ""}`);
  },
  createPost(input: {
    nestSlug: string;
    type: PostType;
    title: string;
    content?: string;
    url?: string;
  }) {
    return request<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getPost(id: string) {
    return request<Post>(`/api/posts/${encodeURIComponent(id)}`);
  },
  deletePost(id: string) {
    return request<{ ok: true }>(`/api/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  listComments(postId: string) {
    return request<Comment[]>(`/api/posts/${encodeURIComponent(postId)}/comments`);
  },
  createComment(
    postId: string,
    input: { content: string; parentId?: string }
  ) {
    return request<Comment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  deleteComment(id: string) {
    return request<{ ok: true }>(`/api/comments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  vote(input: { targetType: VoteTargetType; targetId: string; value: Exclude<VoteValue, 0> }) {
    return request<VoteState>("/api/votes", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  removeVote(input: { targetType: VoteTargetType; targetId: string }) {
    return request<VoteState>("/api/votes", {
      method: "DELETE",
      body: JSON.stringify(input),
    });
  },
};
