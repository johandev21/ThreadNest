"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { Comment } from "@/lib/api";
import { useComments, useCreateComment, usePost } from "@/lib/queries";
import { useRealtimeTopics } from "@/lib/realtime";
import { domainOf } from "@/lib/url";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AuthorDeleteButton } from "@/components/author-delete-button";
import { CommentTree } from "@/components/comment-tree";
import { PostCardSkeleton } from "@/components/post-card-skeleton";
import { PostMetaLine } from "@/components/post-meta-line";
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

  useRealtimeTopics(
    post ? [`post:${post.id}`, `nest:${post.nestSlug}`] : []
  );

  if (isLoading) return <PostDetailSkeleton />;
  if (isError || !post) return <PostErrorState />;

  const isAuthor = session?.user?.id === post.authorId;
  const authenticated = Boolean(session?.user);
  const url = post.type === "link" ? post.url : undefined;
  const domain = url ? domainOf(url) : null;

  async function handleCommentSubmit() {
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
            <PostMetaLine
              nestSlug={post.nestSlug}
              authorName={post.authorName}
              createdAt={post.createdAt}
            />
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
                <AuthorDeleteButton
                  postId={post.id}
                  showLabel
                  onDeleted={() => router.push("/")}
                />
              </div>
            ) : null}
          </CardContent>
        </div>
      </Card>

      {authenticated ? (
        <CommentComposer
          draft={draft}
          onDraftChange={setDraft}
          pending={createComment.isPending}
          onSubmit={handleCommentSubmit}
        />
      ) : (
        <CommentGateAlert />
      )}

      <CommentsSection
        postId={postId}
        commentCount={post.commentCount}
        comments={comments}
        isLoading={commentsLoading}
        isError={commentsError}
      />
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PostCardSkeleton detailed />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function PostErrorState() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Post not found</AlertTitle>
      <AlertDescription>This post does not exist or failed to load.</AlertDescription>
    </Alert>
  );
}

interface CommentComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  pending: boolean;
  onSubmit: () => void;
}

function CommentComposer({
  draft,
  onDraftChange,
  pending,
  onSubmit,
}: CommentComposerProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Share your thoughts..."
          aria-label="Write a comment"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Be kind and keep it on topic.
          </p>
          <Button
            size="sm"
            disabled={!draft.trim() || pending}
            onClick={onSubmit}
          >
            {pending ? (
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
  );
}

function CommentGateAlert() {
  return (
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
  );
}

interface CommentsSectionProps {
  postId: string;
  commentCount: number;
  comments: Comment[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

function CommentsSection({
  postId,
  commentCount,
  comments,
  isLoading,
  isError,
}: CommentsSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-heading text-sm font-semibold tracking-tight">
        {commentCount} {commentCount === 1 ? "comment" : "comments"}
      </h2>
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="ml-6 h-12 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
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
  );
}
