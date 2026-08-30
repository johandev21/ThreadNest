import { useQuery } from "@tanstack/react-query";
import { getPost } from "../api/get-post";
import { postKeys } from "./post-keys";

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => getPost(id),
  });
}
