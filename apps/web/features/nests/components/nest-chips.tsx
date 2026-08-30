"use client";

import Link from "next/link";

import { useNests } from "../hooks/use-nests";
import { NestAvatar } from "./nest-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function NestChips() {
  const { data: nests, isLoading } = useNests();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    );
  }

  if (!nests || nests.length === 0) return null;

  return (
    <nav aria-label="Nests" className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-2">
        {nests.map((nest) => (
          <Link
            key={nest.id}
            href={`/n/${nest.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-foreground/10 dark:ring-foreground/10"
          >
            <NestAvatar slug={nest.slug} size="sm" />
            <span className="font-medium">n/{nest.slug}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
