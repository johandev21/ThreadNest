"use client";

import { Trash2Icon } from "lucide-react";

import { useDeletePost } from "../hooks/use-delete-post";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface PostDeleteButtonProps {
  postId: string;
  onDeleted?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function PostDeleteButton({
  postId,
  onDeleted,
  showLabel = false,
  className,
}: PostDeleteButtonProps) {
  const deletePost = useDeletePost();

  function handleDelete() {
    deletePost.mutate(postId, {
      onSuccess: () => onDeleted?.(),
    });
  }

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={deletePost.isPending}
        onClick={handleDelete}
        className={cn("text-muted-foreground hover:text-destructive", className)}
      >
        <Trash2Icon data-icon="inline-start" />
        Delete post
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Delete post"
      disabled={deletePost.isPending}
      onClick={handleDelete}
      className={cn("text-muted-foreground hover:text-destructive", className)}
    >
      <Trash2Icon />
    </Button>
  );
}

// Backward compatibility alias for migration
export { PostDeleteButton as AuthorDeleteButton };
