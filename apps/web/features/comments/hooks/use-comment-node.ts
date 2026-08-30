"use client";

import { useState } from "react";
import { useSession } from "@/features/auth/hooks/use-session";
import { useCreateComment } from "./use-create-comment";
import { useDeleteComment } from "./use-delete-comment";
import type { Comment } from "../types/comment.types";

export function useCommentNode(postId: string, comment: Comment) {
  const { data: session } = useSession();
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

  function toggleReply() {
    setReplyOpen((open) => !open);
  }

  function handleDelete() {
    deleteComment.mutate(comment.id);
  }

  return {
    isAuthor,
    replyOpen,
    replyContent,
    setReplyContent,
    isCreatingReply: createComment.isPending,
    isDeleting: deleteComment.isPending,
    handleReplySubmit,
    handleReplyCancel,
    toggleReply,
    handleDelete,
  };
}
