import { apiClient } from "@/shared/api/api-client";
import type { CreatePostInput, Post } from "../types/post.types";

export function createPost(input: CreatePostInput): Promise<Post> {
  return apiClient.post<Post>("/api/posts", input);
}
