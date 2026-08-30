import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "../api/delete-post";
import { postKeys } from "./post-keys";
import { nestKeys } from "@/features/nests/hooks/nest-keys";

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      queryClient.removeQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: nestKeys.all });
    },
  });
}
