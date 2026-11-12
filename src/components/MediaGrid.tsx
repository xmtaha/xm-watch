import type { Title } from "../lib/types";
import { PosterCard } from "./PosterCard";

export function MediaGrid({ items, loading = false, count = 12 }: { items: Title[]; loading?: boolean; count?: number }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[2/3] rounded-[10px]" />
            <div className="mt-2 h-3 w-3/4 rounded bg-ink-800" />
            <div className="mt-1.5 h-2.5 w-1/3 rounded bg-ink-800/70" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((item) => (
        <PosterCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}