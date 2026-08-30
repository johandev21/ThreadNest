"use client";

import { Trash2Icon } from "lucide-react";

import { useDeletePost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthorDeleteButtonProps {
  postId: string;
  onDeleted?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function AuthorDeleteButton({
  postId,
  onDeleted,
  showLabel = false,
  className,
}: AuthorDeleteButtonProps) {
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
