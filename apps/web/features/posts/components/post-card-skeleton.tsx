import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";

interface PostCardSkeletonProps {
  detailed?: boolean;
  className?: string;
}

export function PostCardSkeleton({
  detailed = false,
  className,
}: PostCardSkeletonProps) {
  return (
    <Card
      size="sm"
      className={cn("flex-row items-stretch gap-0 py-0", className)}
    >
      <div
        className={cn(
          "flex flex-col items-center px-2",
          detailed ? "py-4" : "py-3.5"
        )}
      >
        <div className="flex flex-col items-center gap-1.5 rounded-full bg-muted/70 px-1.5 py-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-5" />
          <Skeleton className="size-4 rounded-full" />
        </div>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col",
          detailed ? "gap-3 py-5 pr-5" : "gap-2.5 py-4 pr-4"
        )}
      >
        <Skeleton className={detailed ? "h-3 w-48" : "h-3 w-44"} />
        <Skeleton className={detailed ? "h-6 w-3/4" : "h-4 w-3/4"} />
        {detailed ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <Skeleton className="h-3 w-24" />
        )}
      </div>
    </Card>
  );
}
