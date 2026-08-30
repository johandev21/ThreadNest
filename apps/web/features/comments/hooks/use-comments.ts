import { useQuery } from "@tanstack/react-query";
import { listComments } from "../api/list-comments";
import { commentKeys } from "./comment-keys";

export function useComments(postId: string) {
  return useQuery({
    queryKey: commentKeys.list(postId),
    queryFn: () => listComments(postId),
  });
}
