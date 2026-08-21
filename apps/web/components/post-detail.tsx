"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { timeago } from "@/lib/timeago";
import { useComments, useCreateComment, useDeletePost, usePost } from "@/lib/queries";
import { useRealtimeTopics } from "@/lib/realtime";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { CommentTree } from "@/components/comment-tree";
import { NestAvatar } from "@/components/nest-avatar";
import { domainOf } from "@/components/post-card";
import { VoteButtons } from "@/components/vote-buttons";

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: post, isLoading, isError } = usePost(postId);
  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useComments(postId);
  const [draft, setDraft] = useState("");
  const createComment = useCreateComment(postId);
  const deletePost = useDeletePost();

  useRealtimeTopics(
    post ? [`post:${post.id}`, `nest:${post.nestSlug}`] : []
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card size="sm" className="flex-row items-stretch gap-0 py-0">
          <div className="flex flex-col items-center px-2 py-4">
            <div className="flex flex-col items-center gap-1.5 rounded-full bg-muted/70 px-1.5 py-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-5" />
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 py-5 pr-5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Post not found</AlertTitle>
        <AlertDescription>This post does not exist or failed to load.</AlertDescription>
      </Alert>
    );
  }

  const isAuthor = session?.user?.id === post.authorId;
  const authenticated = Boolean(session?.user);
  const url = post.type === "link" ? post.url : undefined;
  const domain = url ? domainOf(url) : null;

  async function submitComment() {
    const content = draft.trim();
    if (!content) return;
    try {
      await createComment.mutateAsync({ content });
      setDraft("");
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm" className="flex-row items-stretch gap-0 py-0">
        <div className="flex flex-col items-center px-2 py-4">
          <div className="flex flex-col items-center gap-0.5 rounded-full bg-muted/70 px-1 py-1.5">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              score={post.score}
              myVote={post.myVote}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 py-5 pr-5">
          <CardHeader className="p-0">
            <CardDescription className="flex flex-wrap items-center gap-x-1.5 text-xs">
              <NestAvatar slug={post.nestSlug} size="sm" />
              <Link href={`/n/${post.nestSlug}`} className="font-medium hover:text-foreground">
                n/{post.nestSlug}
              </Link>
              <span aria-hidden>·</span>
              <span>{post.authorName}</span>
              <span aria-hidden>·</span>
              <span suppressHydrationWarning>{timeago(post.createdAt)}</span>
            </CardDescription>
            <CardTitle className="text-2xl font-bold leading-tight tracking-tight">
              {post.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-0">
            {url && domain ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-accent"
              >
                <ExternalLinkIcon className="size-3.5 shrink-0" />
                {domain}
              </a>
            ) : null}
            {post.content ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
            ) : null}
            {isAuthor ? (
              <div className="mt-auto pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={deletePost.isPending}
                  onClick={() =>
                    deletePost.mutate(post.id, {
                      onSuccess: () => router.push("/"),
                    })
                  }
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete post
                </Button>
              </div>
            ) : null}
          </CardContent>
        </div>
      </Card>

      {authenticated ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share your thoughts..."
              aria-label="Write a comment"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Be kind and keep it on topic.
              </p>
              <Button
                size="sm"
                disabled={!draft.trim() || createComment.isPending}
                onClick={submitComment}
              >
                {createComment.isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Commenting
                  </>
                ) : (
                  "Comment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>Join the discussion</AlertTitle>
          <AlertDescription>
            You need an account to comment.{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/register" className="underline underline-offset-4">
              register
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>
        {commentsLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="ml-6 h-12 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : commentsError ? (
          <Alert variant="destructive">
            <AlertTitle>Failed to load comments</AlertTitle>
            <AlertDescription>Try refreshing the page.</AlertDescription>
          </Alert>
        ) : comments && comments.length > 0 ? (
          <CommentTree postId={postId} comments={comments} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to reply.
          </p>
        )}
      </section>
    </div>
  );
}
