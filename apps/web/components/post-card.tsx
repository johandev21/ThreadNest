"use client";

import Link from "next/link";
import { ExternalLinkIcon, MessageSquareIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { Post } from "@/lib/api";
import { domainOf } from "@/lib/url";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthorDeleteButton } from "@/components/author-delete-button";
import { PostMetaLine } from "@/components/post-meta-line";
import { VoteButtons } from "@/components/vote-buttons";

export { domainOf } from "@/lib/url";

export function PostCard({ post }: { post: Post }) {
  const { data: session } = authClient.useSession();
  const isAuthor = session?.user?.id === post.authorId;
  const url = post.type === "link" ? post.url : undefined;
  const domain = url ? domainOf(url) : null;

  return (
    <Card
      size="sm"
      className="flex-row items-stretch gap-0 py-0 transition-colors hover:ring-ring/30"
    >
      <div className="flex flex-col items-center justify-start gap-1 px-2 py-3.5">
        <div className="flex flex-col items-center gap-0.5 rounded-full bg-muted/70 px-1 py-1.5">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            score={post.score}
            myVote={post.myVote}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4 pr-4">
        <PostMetaLine
          nestSlug={post.nestSlug}
          authorName={post.authorName}
          createdAt={post.createdAt}
        />
        <h3 className="flex flex-wrap items-center gap-x-1.5 font-heading text-[15px] font-semibold leading-snug">
          <Link href={`/p/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
          {url && domain ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open external link: ${domain}`}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-normal text-secondary-foreground hover:bg-accent"
            >
              <ExternalLinkIcon className="size-3 shrink-0" />
              {domain}
            </a>
          ) : null}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            render={<Link href={`/p/${post.id}`} />}
            nativeButton={false}
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
          >
            <MessageSquareIcon data-icon="inline-start" />
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </Button>
          {isAuthor ? <AuthorDeleteButton postId={post.id} /> : null}
        </div>
      </div>
    </Card>
  );
}
