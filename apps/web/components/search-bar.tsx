"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import type { Nest } from "@/lib/api";
import { useNests } from "@/lib/queries";
import { NestAvatar } from "@/components/nest-avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: nests, isLoading } = useNests();

  const matches =
    nests?.filter((nest) =>
      nest.slug.toLowerCase().includes(query.trim().toLowerCase())
    ) ?? [];

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

  return (
    <div ref={rootRef} className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Search nests"
        aria-label="Search nests"
        className="h-9 rounded-full bg-muted/60 pl-9"
      />
      {showResults ? (
        <NestResultsPanel
          isLoading={isLoading}
          matches={matches}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}

interface NestResultsPanelProps {
  isLoading: boolean;
  matches: Nest[];
  onSelect: () => void;
}

function NestResultsPanel({
  isLoading,
  matches,
  onSelect,
}: NestResultsPanelProps) {
  return (
    <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl bg-popover p-1.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 dark:ring-foreground/10">
      {isLoading ? (
        <div className="flex flex-col gap-1.5 p-1.5">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : matches.length > 0 ? (
        matches.slice(0, 6).map((nest) => (
          <Link
            key={nest.id}
            href={`/n/${nest.slug}`}
            onClick={onSelect}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted"
          >
            <NestAvatar slug={nest.slug} size="sm" />
            <span className="truncate font-medium">n/{nest.slug}</span>
          </Link>
        ))
      ) : (
        <p className="p-2.5 text-muted-foreground">No nests found.</p>
      )}
    </div>
  );
}
