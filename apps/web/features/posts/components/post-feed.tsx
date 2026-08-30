"use client";

import { Suspense } from "react";
import Link from "next/link";
import { FeatherIcon } from "lucide-react";

import { usePostFeed } from "../hooks/use-post-feed";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";

export function PostFeed({ nest }: { nest?: string }) {
  return (
    <Suspense fallback={<PostFeedSkeleton />}>
      <PostFeedContent nest={nest} />
    </Suspense>
  );
}

function PostFeedContent({ nest }: { nest?: string }) {
  const {
    sort,
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleSortChange,
  } = usePostFeed(nest);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={sort} onValueChange={handleSortChange}>
        <TabsList>
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? (
        <PostFeedSkeleton />
      ) : posts.length === 0 ? (
        <EmptyFeed nest={nest} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {hasNextPage ? (
            <LoadMoreButton
              isLoading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
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

export function PostFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Backward compatibility alias for migration
export { PostFeed as Feed };
