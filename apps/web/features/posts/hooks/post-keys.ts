import type { Sort } from "../types/post.types";

export const postKeys = {
  all: ["posts"] as const,
  feed: (sort: Sort, nest?: string) => ["feed", sort, nest ?? null] as const,
  detail: (id: string) => ["post", id] as const,
};
