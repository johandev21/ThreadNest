"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FeatherIcon } from "lucide-react";

import type { Sort } from "@/lib/api";
import { useFeed } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post-card";
import { PostCardSkeleton } from "@/components/post-card-skeleton";

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

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={sort} onValueChange={handleSortChange}>
        <TabsList>
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>
      </Tabs>
      {feed.isLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <EmptyFeed nest={nest} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {feed.hasNextPage ? (
            <LoadMoreButton
              isLoading={feed.isFetchingNextPage}
              onClick={() => feed.fetchNextPage()}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyFeed({ nest }: { nest?: string }) {
  const description = nest
    ? `Be the first to post in n/${nest}.`
    : "Nothing here yet. Start the conversation!";

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FeatherIcon />
        </EmptyMedia>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/submit" />} nativeButton={false} variant="outline" size="sm">
          Create a post
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface LoadMoreButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

function LoadMoreButton({ isLoading, onClick }: LoadMoreButtonProps) {
  return (
    <Button
      variant="ghost"
      className="w-full border border-dashed border-border text-muted-foreground"
      disabled={isLoading}
      onClick={onClick}
    >
      {isLoading ? "Loading..." : "Load more"}
    </Button>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}
