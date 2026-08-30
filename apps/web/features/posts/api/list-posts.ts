import { apiClient } from "@/shared/api/api-client";
import type { FeedResponse, ListPostsParams } from "../types/post.types";

export function listPosts(params: ListPostsParams = {}): Promise<FeedResponse> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.nest) search.set("nest", params.nest);
  if (params.cursor !== undefined) search.set("cursor", String(params.cursor));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiClient.get<FeedResponse>(`/api/posts${qs ? `?${qs}` : ""}`);
}
