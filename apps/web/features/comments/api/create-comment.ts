import { apiClient } from "@/shared/api/api-client";
import type { Comment, CreateCommentInput } from "../types/comment.types";

export function createComment(
  postId: string,
  input: CreateCommentInput
): Promise<Comment> {
  return apiClient.post<Comment>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
    input
  );
}
