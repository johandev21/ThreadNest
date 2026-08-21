"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FeatherIcon } from "lucide-react";

import type { Sort } from "@/lib/api";
import { useFeed } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post-card";

const SORTS: Sort[] = ["hot", "new", "top"];

export function Feed({ nest }: { nest?: string }) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent nest={nest} />
    </Suspense>
  );
}

function FeedContent({ nest }: { nest?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");
  const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : "hot";

  const feed = useFeed(sort, nest);
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  function handleSortChange(value: Sort) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={sort} onValueChange={(value) => handleSortChange(value as Sort)}>
        <TabsList>
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>
      </Tabs>
      {feed.isLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FeatherIcon />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              {nest
                ? `Be the first to post in n/${nest}.`
                : "Nothing here yet. Start the conversation!"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/submit" />} nativeButton={false} variant="outline" size="sm">
              Create a post
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {feed.hasNextPage ? (
            <Button
              variant="ghost"
              className="w-full border border-dashed border-border text-muted-foreground"
              disabled={feed.isFetchingNextPage}
              onClick={() => feed.fetchNextPage()}
            >
              {feed.isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} size="sm" className="flex-row items-stretch gap-0 py-0">
          <div className="flex flex-col items-center px-2 py-3.5">
            <div className="flex flex-col items-center gap-1.5 rounded-full bg-muted/70 px-1.5 py-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-5" />
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 py-4 pr-4">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}
