"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Sort } from "../types/post.types";
import { useFeed } from "./use-feed";

const SORTS: Sort[] = ["hot", "new", "top"];

export function usePostFeed(nest?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");
  const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : "hot";

  const feed = useFeed(sort, nest);
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return {
    sort,
    posts,
    isLoading: feed.isLoading,
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
    handleSortChange,
  };
}
