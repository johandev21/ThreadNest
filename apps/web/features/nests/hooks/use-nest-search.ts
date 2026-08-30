"use client";

import { useEffect, useRef, useState } from "react";
import { useNests } from "./use-nests";
import { filterNests } from "../utils/filter-nests";

export function useNestSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: nests, isLoading } = useNests();

  const matches = filterNests(nests, query);
  const showResults = open && query.trim().length > 0;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSelect() {
    setOpen(false);
    setQuery("");
  }

  return {
    query,
    setQuery,
    open,
    setOpen,
    rootRef,
    isLoading,
    matches,
    showResults,
    handleSelect,
  };
}
