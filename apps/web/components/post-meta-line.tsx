import Link from "next/link";

import { NestAvatar } from "@/components/nest-avatar";
import { timeago } from "@/lib/timeago";
import { cn } from "@/lib/utils";

interface PostMetaLineProps {
  nestSlug: string;
  authorName: string;
  createdAt: string;
  className?: string;
}

export function PostMetaLine({
  nestSlug,
  authorName,
  createdAt,
  className,
}: PostMetaLineProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <NestAvatar slug={nestSlug} size="sm" />
      <Link
        href={`/n/${nestSlug}`}
        className="font-medium hover:text-foreground"
      >
        n/{nestSlug}
      </Link>
      <span aria-hidden>·</span>
      <span>{authorName}</span>
      <span aria-hidden>·</span>
      <span suppressHydrationWarning>{timeago(createdAt)}</span>
    </div>
  );
}
