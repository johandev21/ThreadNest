import { Feed } from "@/components/feed";
import { NestSidebar } from "@/components/nest-sidebar";
import { NestChips } from "@/components/nest-chips";

export default function HomePage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <NestChips />
        </div>
        <Feed />
      </div>
      <aside className="hidden lg:block lg:pt-12">
        <NestSidebar />
      </aside>
    </div>
  );
}
