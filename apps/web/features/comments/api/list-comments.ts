import { apiClient } from "@/shared/api/api-client";
import type { Comment } from "../types/comment.types";

export function listComments(postId: string): Promise<Comment[]> {
  return apiClient.get<Comment[]>(
    `/api/posts/${encodeURIComponent(postId)}/comments`
  );
}
