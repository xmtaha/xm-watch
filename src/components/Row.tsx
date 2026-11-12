import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Row as RowData } from "../lib/types";
import { useT } from "../lib/i18n";
import { PosterCard } from "./PosterCard";

export function Row({ row }: { row: RowData }) {
  const t = useT();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [row.items.length]);

  const scroll = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: "smooth" });
  };

  if (!row.items.length) return null;

  return (
    <section className="group/row relative mt-10 md:mt-14" aria-labelledby={`row-${row.key}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={`row-${row.key}`} className="font-display text-[1.65rem] leading-none text-cream md:text-[2rem]">
            {row.title}
          </h2>
        </div>
        <span className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent md:block" />
      </div>

      <div className="relative -mx-4 md:-mx-8 xl:-mx-12">
        {edges.left && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-2 top-1/2 z-20 hidden size-10 -translate-y-[55%] place-items-center rounded-full border border-white/15 bg-ink-950/80 text-cream opacity-0 backdrop-blur transition hover:bg-ink-800 group-hover/row:opacity-100 md:grid xl:left-5"
            aria-label={t("row.scrollLeft")}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {edges.right && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-2 top-1/2 z-20 hidden size-10 -translate-y-[55%] place-items-center rounded-full border border-white/15 bg-ink-950/80 text-cream opacity-0 backdrop-blur transition hover:bg-ink-800 group-hover/row:opacity-100 md:grid xl:right-5"
            aria-label={t("row.scrollRight")}
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scroller}
          onScroll={update}
          className="row-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-1 md:gap-4 md:px-8 xl:px-12"
        >
          {row.items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`shrink-0 snap-start ${row.wide ? "w-[168px] sm:w-[196px] lg:w-[220px]" : "w-[136px] sm:w-[156px] lg:w-[176px]"}`}
            >
              <PosterCard
                item={item}
                progress={row.continueRow ? item.percent : undefined}
                context={row.continueRow ? (item.context ?? t("row.resume")) : undefined}
                href={
                  row.continueRow
                    ? `/watch/${item.type}/${item.id}${item.progress?.season ? `?season=${item.progress.season}&episode=${item.progress.episode}` : ""}`
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RowSkeleton({ title }: { title?: string }) {
  const t = useT();
  return (
    <section className="mt-10 md:mt-14">
      <div className="mb-4 h-7 w-48 rounded bg-ink-800">
        <span className="sr-only">{title ?? t("row.loading")}</span>
      </div>
      <div className="flex gap-3 overflow-hidden md:gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-[136px] shrink-0 sm:w-[156px] lg:w-[176px]">
            <div className="skeleton aspect-[2/3] rounded-[10px]" />
            <div className="mt-2 h-3 w-3/4 rounded bg-ink-800" />
            <div className="mt-1.5 h-2.5 w-1/3 rounded bg-ink-800/70" />
          </div>
        ))}
      </div>
    </section>
  );
}