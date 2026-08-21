"use client";

import { useMemo, useState } from "react";
import { Trash2Icon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { timeago } from "@/lib/timeago";
import type { Comment } from "@/lib/api";
import { useCreateComment, useDeleteComment } from "@/lib/queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { VoteButtons } from "@/components/vote-buttons";

interface CommentNode {
  comment: Comment;
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) {
    nodes.set(comment.id, { comment, children: [] });
  }
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.comment.parentId
      ? nodes.get(node.comment.parentId)
      : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byNewest = (a: CommentNode, b: CommentNode) =>
    new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime();
  roots.sort(byNewest);
  for (const node of nodes.values()) {
    node.children.sort(byNewest);
  }
  return roots;
}

export function CommentTree({ postId, comments }: { postId: string; comments: Comment[] }) {
  const tree = useMemo(() => buildTree(comments), [comments]);

  return (
    <div className="flex flex-col gap-6">
      {tree.map((node) => (
        <CommentNodeView key={node.comment.id} node={node} postId={postId} />
      ))}
    </div>
  );
}

function CommentNodeView({
  node,
  postId,
}: {
  node: CommentNode;
  postId: string;
}) {
  const { comment, children } = node;
  const { data: session } = authClient.useSession();
  const isAuthor = session?.user?.id === comment.authorId;
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);

  async function submitReply() {
    const content = replyContent.trim();
    if (!content) return;
    try {
      await createComment.mutateAsync({ content, parentId: comment.id });
      setReplyContent("");
      setReplyOpen(false);
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-2 flex flex-col gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar size="sm">
            <AvatarFallback>{comment.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{comment.authorName}</span>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>{timeago(comment.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-1">
          <VoteButtons
            compact
            targetType="comment"
            targetId={comment.id}
            score={comment.score}
            myVote={comment.myVote}
          />
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => setReplyOpen((open) => !open)}
          >
            Reply
          </Button>
          {isAuthor ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Delete comment"
              disabled={deleteComment.isPending}
              onClick={() => deleteComment.mutate(comment.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
        {replyOpen ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              placeholder={`Reply to ${comment.authorName}...`}
              aria-label="Write a reply"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyOpen(false);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!replyContent.trim() || createComment.isPending}
                onClick={submitReply}
              >
                {createComment.isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Replying
                  </>
                ) : (
                  "Reply"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {children.length > 0 ? (
        <div className="ml-3 flex flex-col gap-5 border-l-2 border-border/60 pl-4">
          {children.map((child) => (
            <CommentNodeView key={child.comment.id} node={child} postId={postId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
