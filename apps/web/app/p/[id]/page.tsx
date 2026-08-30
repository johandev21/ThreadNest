import { PostDetail } from "@/features/posts";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
      <PostDetail postId={id} />
    </div>
  );
}
