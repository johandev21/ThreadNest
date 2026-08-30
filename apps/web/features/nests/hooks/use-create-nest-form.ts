"use client";

import { useState, type FormEvent } from "react";
import { useCreateNest } from "./use-create-nest";

export function useCreateNestForm() {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createNest = useCreateNest();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!slug.trim() || !title.trim()) return;
    try {
      await createNest.mutateAsync({
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim(),
      });
      setOpen(false);
      setSlug("");
      setTitle("");
      setDescription("");
    } catch {
      return;
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  }

  return {
    open,
    setOpen,
    slug,
    setSlug: handleSlugChange,
    title,
    setTitle,
    description,
    setDescription,
    isPending: createNest.isPending,
    handleSubmit,
  };
}
