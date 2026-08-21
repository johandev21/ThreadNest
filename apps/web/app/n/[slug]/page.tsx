import { Feed } from "@/components/feed";
import { NestHeader } from "@/components/nest-header";

export default async function NestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <NestHeader slug={slug} />
      <Feed nest={slug} />
    </div>
  );
}
