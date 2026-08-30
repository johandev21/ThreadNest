import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "../api/delete-comment";
import { commentKeys } from "./comment-keys";
import { postKeys } from "@/features/posts/hooks/post-keys";

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}
