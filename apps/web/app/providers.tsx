"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { realtime } from "@/shared/realtime/realtime-manager";
import { applyScorePatch } from "@/features/votes";
import { commentKeys, type Comment } from "@/features/comments";
import type { Post } from "@/features/posts";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const unsubPost = realtime.on<Post>("post:new", () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    });

    const unsubComment = realtime.on<Comment>("comment:new", (comment) => {
      if (!comment?.id || !comment.postId) return;
      queryClient.setQueryData<Comment[]>(
        commentKeys.list(comment.postId),
        (existing) => {
          if (!existing) return existing;
          if (existing.some((item) => item.id === comment.id)) return existing;
          return [...existing, comment];
        }
      );
    });

    const unsubVote = realtime.on<{ targetType: string; targetId: string; score: number }>(
      "vote:update",
      (payload) => {
        if (!payload?.targetId || typeof payload.score !== "number") return;
        applyScorePatch(queryClient, payload.targetId, payload.score);
      }
    );

    return () => {
      unsubPost();
      unsubComment();
      unsubVote();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
