import { apiClient } from "@/shared/api/api-client";
import type { Post } from "../types/post.types";

export function getPost(id: string): Promise<Post> {
  return apiClient.get<Post>(`/api/posts/${encodeURIComponent(id)}`);
}
