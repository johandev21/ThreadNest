"use client";

import { useMemo } from "react";
import { Trash2Icon } from "lucide-react";

import { timeago } from "@/shared/utils/format-date";
import type { Comment } from "../types/comment.types";
import { buildCommentTree, type CommentNode } from "../utils/build-comment-tree";
import { useCommentNode } from "../hooks/use-comment-node";
import { VoteButtons } from "@/features/votes/components/vote-buttons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export function CommentTree({
  postId,
  comments,
}: {
  postId: string;
  comments: Comment[];
}) {
  const tree = useMemo(() => buildCommentTree(comments), [comments]);

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
  const {
    isAuthor,
    replyOpen,
    replyContent,
    setReplyContent,
    isCreatingReply,
    isDeleting,
    handleReplySubmit,
    handleReplyCancel,
    toggleReply,
    handleDelete,
  } = useCommentNode(postId, comment);

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
          isDeleting={isDeleting}
          onToggleReply={toggleReply}
          onDelete={handleDelete}
        />
        {replyOpen ? (
          <ReplyForm
            authorName={comment.authorName}
            content={replyContent}
            onContentChange={setReplyContent}
            pending={isCreatingReply}
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
