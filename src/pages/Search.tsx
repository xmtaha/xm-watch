import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search, SearchX, X } from "lucide-react";
import { useApi, useDebounced } from "../lib/hooks";
import type { HomeResponse, Page, Title } from "../lib/types";
import { MediaGrid } from "../components/MediaGrid";
import { EmptyState, ErrorState } from "../components/States";
import { useT } from "../lib/i18n";

const YEARS = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);

export default function SearchPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "all";
  const genre = params.get("genre") ?? "";
  const year = params.get("year") ?? "";
  const rating = params.get("rating") ?? "";

  const [input, setInput] = useState(q);
  const debounced = useDebounced(input, 380);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPushed = useRef(q);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounced === lastPushed.current) return;
    lastPushed.current = debounced;
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set("q", debounced.trim());
    else next.delete("q");
    setParams(next, { replace: true });
    // params intentionally not in deps: only the debounced query drives updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, setParams]);

  const searching = Boolean(q.trim());
  const path = searching
    ? `/search?q=${encodeURIComponent(q.trim())}&type=${type}${genre ? `&genre=${encodeURIComponent(genre)}` : ""}${
        year ? `&year=${year}` : ""
      }${rating ? `&rating=${rating}` : ""}`
    : "/home";

  const results = useApi<Page<Title> | HomeResponse>(path);
  const { data: genreData } = useApi<{ genres: { id: string; name: string }[] }>("/genres?type=movie");

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const items: Title[] = searching
    ? ((results.data as Page<Title>)?.results ?? [])
    : ((results.data as HomeResponse)?.trending?.slice(0, 12) ?? []);
  const totalResults = searching ? (results.data as Page<Title>)?.totalPages ?? 0 : 0;

  return (
    <div className="shell pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="label mb-3 text-gold/80">{t("search.title")}</p>
        <h1 className="font-display text-4xl leading-none text-cream md:text-5xl">{t("search.prompt")}</h1>

        <div className="relative mt-7">
          <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setInput("");
            }}
            type="search"
            placeholder={t("search.placeholder")}
            aria-label={t("search.aria")}
            className="field !rounded-2xl border-white/10 bg-ink-900/80 py-4 pl-12 pr-12 text-base shadow-xl shadow-black/30 backdrop-blur"
          />
          {input && (
            <button
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-white/5 hover:text-cream"
              aria-label={t("search.clear")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {(
            [
              { value: "all", key: "search.everything" },
              { value: "movie", key: "search.films" },
              { value: "tv", key: "search.series" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              className="chip"
              data-active={type === option.value}
              onClick={() => update("type", option.value)}
            >
              {t(option.key)}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          <select
            className="field w-auto py-1.5 text-xs"
            value={year}
            onChange={(e) => update("year", e.target.value)}
            aria-label={t("search.year")}
          >
            <option value="">{t("browse.anyYear")}</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="field w-auto py-1.5 text-xs"
            value={rating}
            onChange={(e) => update("rating", e.target.value)}
            aria-label={t("search.rating")}
          >
            <option value="">{t("browse.anyRating")}</option>
            {["6", "7", "8", "9"].map((r) => (
              <option key={r} value={r}>
                {r}.0+
              </option>
            ))}
          </select>
          {genre && (
            <button className="chip" data-active onClick={() => update("genre", "")}>
              {genre} <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 md:mt-14">
        {results.error && !results.data ? (
          <ErrorState message={results.error} onRetry={results.reload} />
        ) : results.loading ? (
          <div>
            <p className="mb-6 flex items-center gap-2 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" /> {t("search.searching")}
            </p>
            <MediaGrid items={[]} loading count={12} />
          </div>
        ) : searching ? (
          items.length ? (
            <>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg text-cream">{t("search.results", { query: q.trim() })}</h2>
                <span className="text-xs uppercase tracking-wider text-muted">
                  {t(items.length === 1 ? "search.countOne" : "search.count", {
                    count: items.length,
                    page: totalResults || 1,
                  })}
                </span>
              </div>
              <MediaGrid items={items} />
            </>
          ) : (
            <EmptyState
              icon={<SearchX size={20} />}
              title={t("search.empty", { query: q.trim() })}
              description={t("search.emptyBody")}
              action={
                <button
                  onClick={() => setParams(new URLSearchParams(), { replace: true })}
                  className="btn btn-ghost"
                >
                  {t("search.reset")}
                </button>
              }
            />
          )
        ) : (
          <>
            <div className="mb-6">
              <p className="label mb-3">{t("search.byGenre")}</p>
              <div className="flex flex-wrap gap-2">
                {genreData?.genres.slice(0, 14).map((g) => (
                  <button key={g.id} className="chip" onClick={() => update("genre", g.name)}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-2xl text-cream md:text-3xl">{t("search.trending")}</h2>
              <Link to="/films" className="text-xs uppercase tracking-wider text-muted transition hover:text-cream">
                {t("search.browseAll")}
              </Link>
            </div>
            <MediaGrid items={items} />
          </>
        )}
      </div>
    </div>
  );
}