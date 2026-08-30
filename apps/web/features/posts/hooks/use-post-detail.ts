"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/use-session";
import { usePost } from "./use-post";
import { useComments } from "@/features/comments/hooks/use-comments";
import { useCreateComment } from "@/features/comments/hooks/use-create-comment";
import { domainOf } from "@/shared/utils/format-url";

export function usePostDetail(postId: string) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: post, isLoading: isPostLoading, isError: isPostError } = usePost(postId);
  const {
    data: comments,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useComments(postId);
  const [draft, setDraft] = useState("");
  const createComment = useCreateComment(postId);

  const isAuthor = session?.user?.id === post?.authorId;
  const authenticated = Boolean(session?.user);
  const url = post?.type === "link" ? post.url : undefined;
  const domain = url ? domainOf(url) : null;
  const realtimeTopics = post ? [`post:${post.id}`, `nest:${post.nestSlug}`] : [];

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

  function handlePostDeleted() {
    router.push("/");
  }

  return {
    post,
    isPostLoading,
    isPostError,
    comments,
    isCommentsLoading,
    isCommentsError,
    isAuthor,
    authenticated,
    url,
    domain,
    draft,
    setDraft,
    isCreatingComment: createComment.isPending,
    realtimeTopics,
    handleCommentSubmit,
    handlePostDeleted,
  };
}
