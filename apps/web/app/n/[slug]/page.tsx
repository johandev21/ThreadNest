import { PostFeed } from "@/features/posts";
import { NestHeader } from "@/features/nests";

export default async function NestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <NestHeader slug={slug} />
      <PostFeed nest={slug} />
    </div>
  );
}
