import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../api/create-post";
import type { CreatePostInput } from "../types/post.types";
import { nestKeys } from "@/features/nests/hooks/nest-keys";

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: nestKeys.all });
    },
  });
}
