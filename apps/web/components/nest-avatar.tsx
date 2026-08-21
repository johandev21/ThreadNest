import { cn } from "@/lib/utils";

function hueFromSlug(slug: string) {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) % 360;
  }
  return hash;
}

interface NestAvatarProps {
  slug: string;
  size?: "sm" | "md";
  className?: string;
}

export function NestAvatar({ slug, size = "md", className }: NestAvatarProps) {
  const hue = hueFromSlug(slug);

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-semibold select-none",
        size === "sm" ? "size-5 text-[10px]" : "size-7 text-xs",
        className
      )}
      style={{
        backgroundColor: `oklch(0.6 0.12 ${hue} / 0.18)`,
        color: `oklch(0.55 0.13 ${hue})`,
      }}
    >
      {slug.slice(0, 1).toUpperCase()}
    </span>
  );
}
