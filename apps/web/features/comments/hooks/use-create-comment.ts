import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../api/create-comment";
import type { CreateCommentInput } from "../types/comment.types";
import { commentKeys } from "./comment-keys";
import { postKeys } from "@/features/posts/hooks/post-keys";

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}
