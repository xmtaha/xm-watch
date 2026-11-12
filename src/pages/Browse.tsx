import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Loader2, SearchX } from "lucide-react";
import { api } from "../lib/api";
import type { MediaType, Title } from "../lib/types";
import { PageHeading, ErrorState, EmptyState } from "../components/States";
import { MediaGrid } from "../components/MediaGrid";
import { useApi } from "../lib/hooks";
import { useT, type MessageKey } from "../lib/i18n";

const YEARS = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);
const RATINGS: { value: string; key?: MessageKey; label?: string }[] = [
  { value: "", key: "browse.anyRating" },
  { value: "6", label: "6.0+" },
  { value: "7", label: "7.0+" },
  { value: "8", label: "8.0+" },
  { value: "9", label: "9.0+" },
];

const SORTS: { value: string; key: MessageKey }[] = [
  { value: "popularity", key: "browse.sortPopular" },
  { value: "rating", key: "browse.sortRating" },
  { value: "newest", key: "browse.sortNewest" },
  { value: "oldest", key: "browse.sortOldest" },
];

export default function Browse({ type }: { type: MediaType }) {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const genre = params.get("genre") || "";
  const sort = params.get("sort") || "popularity";
  const year = params.get("year") || "";
  const rating = params.get("rating") || "";

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Title[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const { data: genreData } = useApi<{ genres: { id: string; name: string }[] }>(`/genres?type=${type}`);

  useEffect(() => {
    let alive = true;
    const first = page === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    api
      .discover(type, { page, genre, sort, year, rating })
      .then((res) => {
        if (!alive) return;
        setItems((prev) => (first ? res.results : [...prev, ...res.results]));
        setTotalPages(res.totalPages);
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setLoadingMore(false);
      });
    return () => {
      alive = false;
    };
  }, [type, page, genre, sort, year, rating, nonce]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
    setItems([]);
  };

  const reset = () => {
    setParams(new URLSearchParams(), { replace: true });
    setPage(1);
    setItems([]);
  };

  const hasFilters = Boolean(genre || year || rating || sort !== "popularity");


  return (
    <div className="shell">
      <PageHeading
        eyebrow={t("browse.eyebrow")}
        title={t(type === "movie" ? "browse.filmsTitle" : "browse.seriesTitle")}
        description={t(type === "movie" ? "browse.filmsBlurb" : "browse.seriesBlurb")}
      />

      <div className="mt-8 space-y-4 md:mt-10">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <button className="chip" data-active={!genre} onClick={() => update("genre", "")}>
            {t("browse.allGenres")}
          </button>
          {genreData?.genres.map((g) => (
            <button key={g.id} className="chip" data-active={genre === g.name} onClick={() => update("genre", g.name)}>
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] pt-4">
          <span className="hidden items-center gap-1.5 text-xs uppercase tracking-wider text-muted sm:flex">
            <Filter size={13} /> {t("browse.refine")}
          </span>
          <select
            className="field w-auto py-2 text-[13px]"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            aria-label={t("browse.sortBy")}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.key)}
              </option>
            ))}
          </select>
          <select
            className="field w-auto py-2 text-[13px]"
            value={year}
            onChange={(e) => update("year", e.target.value)}
            aria-label={t("browse.releaseYear")}
          >
            <option value="">{t("browse.anyYear")}</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="field w-auto py-2 text-[13px]"
            value={rating}
            onChange={(e) => update("rating", e.target.value)}
            aria-label={t("browse.minRating")}
          >
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.key ? t(r.key) : r.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={reset} className="text-xs text-muted underline decoration-white/20 underline-offset-4 transition hover:text-cream">
              {t("browse.clear")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {error && !items.length ? (
          <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />
        ) : loading ? (
          <MediaGrid items={[]} loading count={12} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<SearchX size={20} />}
            title={t("browse.empty")}
            description={t("browse.emptyBody")}
            action={
              <button onClick={reset} className="btn btn-ghost">
                {t("browse.clear")}
              </button>
            }
          />
        ) : (
          <>
            <MediaGrid items={items} />
            <div className="mt-10 flex flex-col items-center gap-3">
              {page < totalPages ? (
                <button onClick={() => setPage((p) => p + 1)} disabled={loadingMore} className="btn btn-ghost min-w-44">
                  {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loadingMore ? t("browse.loading") : t("browse.loadMore")}
                </button>
              ) : (
                <p className="text-xs uppercase tracking-widest text-muted">
                  {t(type === "movie" ? "browse.endFilms" : "browse.endSeries")}
                </p>
              )}
              <p className="text-xs text-muted">
                {t("browse.counter", {
                  page,
                  pages: totalPages.toLocaleString(),
                  count: items.length,
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
