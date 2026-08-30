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

export function CommentTree({
  postId,
  comments,
}: {
  postId: string;
  comments: Comment[];
}) {
  const tree = useMemo(() => buildTree(comments), [comments]);

  return (
    <div className="flex flex-col gap-6">
      {tree.map((node) => (
        <CommentNodeView key={node.comment.id} node={node} postId={postId} />
      ))}
    </div>
  );
}

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

  async function handleReplySubmit() {
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

  function handleReplyCancel() {
    setReplyOpen(false);
    setReplyContent("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-2 flex flex-col gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/40">
        <CommentHeader
          authorName={comment.authorName}
          createdAt={comment.createdAt}
        />
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
        <CommentActions
          comment={comment}
          isAuthor={isAuthor}
          isDeleting={deleteComment.isPending}
          onToggleReply={() => setReplyOpen((open) => !open)}
          onDelete={() => deleteComment.mutate(comment.id)}
        />
        {replyOpen ? (
          <ReplyForm
            authorName={comment.authorName}
            content={replyContent}
            onContentChange={setReplyContent}
            pending={createComment.isPending}
            onSubmit={handleReplySubmit}
            onCancel={handleReplyCancel}
          />
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

function CommentHeader({
  authorName,
  createdAt,
}: {
  authorName: string;
  createdAt: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Avatar size="sm">
        <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">{authorName}</span>
      <span aria-hidden>·</span>
      <span suppressHydrationWarning>{timeago(createdAt)}</span>
    </div>
  );
}

interface CommentActionsProps {
  comment: Comment;
  isAuthor: boolean;
  isDeleting: boolean;
  onToggleReply: () => void;
  onDelete: () => void;
}

function CommentActions({
  comment,
  isAuthor,
  isDeleting,
  onToggleReply,
  onDelete,
}: CommentActionsProps) {
  return (
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
        onClick={onToggleReply}
      >
        Reply
      </Button>
      {isAuthor ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete comment"
          disabled={isDeleting}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </div>
  );
}

interface ReplyFormProps {
  authorName: string;
  content: string;
  onContentChange: (value: string) => void;
  pending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function ReplyForm({
  authorName,
  content,
  onContentChange,
  pending,
  onSubmit,
  onCancel,
}: ReplyFormProps) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder={`Reply to ${authorName}...`}
        aria-label="Write a reply"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!content.trim() || pending}
          onClick={onSubmit}
        >
          {pending ? (
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
  );
}
