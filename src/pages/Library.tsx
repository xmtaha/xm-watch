import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Heart, Play, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/hooks";
import type { Title } from "../lib/types";
import { PageHeading, EmptyState, ErrorState } from "../components/States";
import { PosterCard } from "../components/PosterCard";
import { Row } from "../components/Row";
import { useToast } from "../components/Toast";
import { useT } from "../lib/i18n";

export default function Library() {
  const library = useApi<{ watchlist: Title[]; favorites: Title[] }>("/library");
  const progress = useApi<{ continueWatching: Title[] }>("/progress");
  const [tab, setTab] = useState<"watchlist" | "favorite">("watchlist");
  const toast = useToast();
  const t = useT();

  const watchlist = library.data?.watchlist ?? [];
  const favorites = library.data?.favorites ?? [];
  const items = tab === "watchlist" ? watchlist : favorites;

  const remove = async (item: Title) => {
    try {
      await api.toggleLibrary(item.type, item.id, tab, false);
      library.reload();
      toast(t("library.removed", { title: item.title }));
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  return (
    <div className="shell">
      <PageHeading
        eyebrow={t("library.eyebrow")}
        title={t("library.title")}
        description={t("library.description")}
      >
        <div className="flex items-center gap-2">
          <button className="chip" data-active={tab === "watchlist"} onClick={() => setTab("watchlist")}>
            <Bookmark size={13} /> {t("library.watchlist")} <span className="opacity-60">{watchlist.length}</span>
          </button>
          <button className="chip" data-active={tab === "favorite"} onClick={() => setTab("favorite")}>
            <Heart size={13} /> {t("library.favourites")} <span className="opacity-60">{favorites.length}</span>
          </button>
        </div>
      </PageHeading>

      <div className="mt-10">
        {library.error && !library.data ? (
          <ErrorState message={library.error} onRetry={library.reload} />
        ) : library.loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 md:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[2/3] rounded-[10px]" />
                <div className="mt-2 h-3 w-3/4 rounded bg-ink-800" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={tab === "watchlist" ? <Bookmark size={20} /> : <Heart size={20} />}
            title={t(tab === "watchlist" ? "library.watchlistEmpty" : "library.favouritesEmpty")}
            description={t(tab === "watchlist" ? "library.watchlistEmptyBody" : "library.favouritesEmptyBody")}
            action={
              <Link to="/films" className="btn btn-gold">
                <Play size={15} /> {t("library.browse")}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group/item relative">
                <PosterCard item={item} />
                <button
                  onClick={() => remove(item)}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border border-white/15 bg-black/70 text-cream/80 opacity-0 backdrop-blur transition hover:border-ember/50 hover:text-ember focus-visible:opacity-100 group-hover/item:opacity-100"
                  aria-label={t("library.removeAria", {
                    title: item.title,
                    list: t(tab === "watchlist" ? "library.listWatchlist" : "library.listFavourites"),
                  })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {progress.data && progress.data.continueWatching.length > 0 && (
        <div className="mt-14">
          <Row
            row={{
              key: "library-continue",
              title: t("library.continue"),
              items: progress.data.continueWatching,
              continueRow: true,
            }}
          />
        </div>
      )}
    </div>
  );
}