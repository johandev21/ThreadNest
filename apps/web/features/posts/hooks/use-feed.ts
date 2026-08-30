import { useInfiniteQuery } from "@tanstack/react-query";
import { listPosts } from "../api/list-posts";
import type { Sort } from "../types/post.types";
import { postKeys } from "./post-keys";

export function useFeed(sort: Sort, nest?: string) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(sort, nest),
    queryFn: ({ pageParam }) =>
      listPosts({ sort, nest, cursor: pageParam, limit: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
