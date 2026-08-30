"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/use-session";
import { useNests } from "@/features/nests/hooks/use-nests";
import { useCreatePost } from "./use-create-post";
import type { PostType } from "../types/post.types";

export function useCreatePostForm() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: nests } = useNests();
  const [nestSlug, setNestSlug] = useState("");
  const [type, setType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createPost = useCreatePost();

  const awaitingSession = isSessionPending || !session?.user;

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login");
    }
  }, [isSessionPending, session, router]);

  function handleTypeChange(value: string[]) {
    if (value[0] === "text" || value[0] === "link") {
      setType(value[0]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!nestSlug || !title.trim()) return;
    try {
      const post = await createPost.mutateAsync({
        nestSlug,
        type,
        title: title.trim(),
        ...(type === "text"
          ? { content: content.trim() || undefined }
          : { url: url.trim() }),
      });
      router.push(`/p/${post.id}`);
    } catch {
      setError("Please check your input and try again.");
    }
  }

  return {
    awaitingSession,
    nests,
    nestSlug,
    setNestSlug,
    type,
    handleTypeChange,
    title,
    setTitle,
    content,
    setContent,
    url,
    setUrl,
    error,
    isSubmitting: createPost.isPending,
    handleSubmit,
  };
}
