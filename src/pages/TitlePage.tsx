import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Layers,
  Play,
  Star,
  Users,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi, useDocumentTitle } from "../lib/hooks";
import type { SeasonResponse, Title } from "../lib/types";
import { episodeCode, mediaLabel, posterFallback, runtime, timecode } from "../lib/format";
import { useT } from "../lib/i18n";
import { ErrorState } from "../components/States";
import { Row } from "../components/Row";
import { TrailerModal } from "../components/TrailerModal";
import { useToast } from "../components/Toast";

function countWatchedEpisodes(watchedSet: Set<string>, season: number, count: number): number {
  let seen = 0;
  for (let ep = 1; ep <= count; ep++) if (watchedSet.has(`${season}:${ep}`)) seen++;
  return seen;
}

export default function TitlePage() {
  const { type = "movie", id = "" } = useParams();
  const mediaType = type === "tv" ? "tv" : "movie";
  const navigate = useNavigate();
  const toast = useToast();
  const t = useT();

  const detail = useApi<Title>(`/title/${mediaType}/${id}`);
  const progress = useApi<{ continueWatching: Title[] }>("/progress");
  const item = detail.data;

  const [trailer, setTrailer] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [season, setSeason] = useState<number>(1);

  useDocumentTitle(item?.title);

  useEffect(() => {
    if (!item) return;
    setInWatchlist(Boolean(item.inWatchlist));
    setIsFavorite(Boolean(item.isFavorite));
    const resume = progress.data?.continueWatching.find((entry) => entry.type === item.type && entry.id === item.id);
    setSeason(resume?.progress?.season || 1);
    // Only when the page changes: a progress refresh must not steal the season pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const resume = progress.data?.continueWatching.find((entry) => entry.type === mediaType && String(entry.id) === id && entry.progress?.season);
  const seasonData = useApi<SeasonResponse>(
    mediaType === "tv" && item ? `/title/tv/${id}/season/${season}` : null,
  );
  const { reload: reloadProgress } = progress;

  // Per-episode truth, read straight from this browser's store. `version` only
  // exists to re-read it after a write; an episode flag never implies the rest.
  const [version, setVersion] = useState(0);
  const [episodeMeta, setEpisodeMeta] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = seasonData.data?.episodes;
    if (!list?.length) return;
    setEpisodeMeta((prev) => ({
      ...prev,
      ...Object.fromEntries(list.map((ep) => [seasonData.data?.season + ":" + ep.episode, ep.runtime ?? 0])),
    }));
  }, [seasonData.data]);

  const watchedSet = useMemo(
    () => new Set(api.watchedEpisodeKeys(mediaType, Number(id))),
    [mediaType, id, version],
  );
  // Specials (season 0) are not part of "the whole series" — TMDB lists them but
  // the series switch never writes them, so they must not skew the totals.
  const regularSeasons = item?.seasonList?.filter((s) => s.season > 0) ?? [];
  // How far into each episode the user got: "12:34" is the whole point of
  // per-episode progress — it tells you where you stopped, not just that you did.
  const stopPoints = useMemo(() => api.episodeStopPoints(mediaType, Number(id)), [mediaType, id, version]);
  const watchedEpisodes = regularSeasons.reduce((sum, s) => sum + countWatchedEpisodes(watchedSet, s.season, s.episodes), 0);
  const totalEpisodes = regularSeasons.reduce((sum, s) => sum + s.episodes, 0);
  const seriesWatched = Boolean(item && totalEpisodes > 0 && watchedEpisodes >= totalEpisodes);

  const markEpisode = async (episode: number, next: boolean, duration: number) => {
    if (!item) return;
    try {
      await api.saveProgress({ type: item.type, id: item.id, season, episode, position: 0, duration, watched: next });
      setVersion((n) => n + 1);
      reloadProgress();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  // The series-level switch is the only way to mark everything at once.
  const markSeries = async () => {
    if (!item) return;
    const episodes = regularSeasons.flatMap((s) =>
      Array.from({ length: s.episodes }, (_, i) => ({
        season: s.season,
        episode: i + 1,
        duration: episodeMeta[s.season + ":" + (i + 1)] || item.runtime || 0,
      })),
    );
    setSaving(true);
    try {
      await api.markTitleWatched({ type: item.type, id: item.id, watched: !seriesWatched, episodes });
      setVersion((n) => n + 1);
      reloadProgress();
      toast(t(seriesWatched ? "title.seriesUnwatched" : "title.seriesWatched", { title: item.title }));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Compact season carousel: one row that actually slides (swipe on touch,
  // arrows on desktop) instead of a grid that pushes the episodes off the page.
  const stripRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const syncEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 4, right: max > 4 && el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges, item, seasonData.data]);

  const scrollStrip = (direction: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const firstEpisode = seasonData.data?.episodes[0];
  const playTarget = useMemo(() => {
    if (mediaType === "movie") return `/watch/movie/${id}`;
    if (resume?.progress) return `/watch/tv/${id}?season=${resume.progress.season}&episode=${resume.progress.episode}`;
    if (season === 1 && firstEpisode) return `/watch/tv/${id}?season=1&episode=${firstEpisode.episode}`;
    const ep = seasonData.data?.episodes[0]?.episode ?? 1;
    return `/watch/tv/${id}?season=${season}&episode=${ep}`;
  }, [mediaType, id, resume, season, firstEpisode, seasonData.data]);

  const toggle = async (list: "watchlist" | "favorite") => {
    if (!item) return;
    const current = list === "watchlist" ? inWatchlist : isFavorite;
    const setter = list === "watchlist" ? setInWatchlist : setIsFavorite;
    setter(!current);
    try {
      await api.toggleLibrary(item.type, item.id, list, !current);
      toast(
        list === "watchlist"
          ? t(!current ? "toast.addedWatchlist" : "toast.removedWatchlist", { title: item.title })
          : t(!current ? "toast.addedFavourite" : "toast.removedFavourite", { title: item.title }),
      );
    } catch (err) {
      setter(current);
      toast((err as Error).message, "error");
    }
  };

  if (detail.error && !item) {
    return (
      <div className="shell pt-28 md:pt-36">
        <ErrorState message={detail.error} onRetry={detail.reload} />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <div className="skeleton h-[58svh] min-h-[420px] w-full" />
        <div className="shell -mt-24 flex gap-8">
          <div className="skeleton hidden aspect-[2/3] w-48 rounded-xl md:block" />
          <div className="flex-1 space-y-4 pt-24">
            <div className="h-10 w-2/3 rounded bg-ink-800" />
            <div className="h-4 w-1/2 rounded bg-ink-800" />
            <div className="h-20 w-full max-w-2xl rounded bg-ink-800/60" />
          </div>
        </div>
      </div>
    );
  }

  const validSeasons = item.seasonList?.filter((s) => s.season > 0) ?? [];
  const currentSeason = validSeasons.find((s) => s.season === season);

  return (
    <article>
      {/* The hero grows with its content: the series controls must never
          spill over the storyline below on a small screen. */}
      <div className="relative flex min-h-[58svh] flex-col overflow-hidden md:min-h-[64svh]">
        <img
          src={item.backdrop || item.poster || posterFallback(item.title)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top md:object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/25 to-transparent" />

        <div className="shell relative flex min-h-0 flex-1 flex-col pt-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-cream/80 backdrop-blur transition hover:bg-black/50 hover:text-cream"
          >
            <ArrowLeft size={14} /> {t("title.back")}
          </button>

          <div className="mt-auto pt-14 pb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-9">
            <div className="hidden w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60 md:block lg:w-44">
              <img
                src={item.poster || posterFallback(item.title)}
                alt={t("title.posterAlt", { title: item.title })}
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                <span className="label text-gold/90">{mediaLabel(item.type)}</span>
                {item.demo && (
                  <span className="rounded-full border border-gold/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold/70">
                    {t("meta.demo")}
                  </span>
                )}
                {item.status && <span className="text-xs text-cream/50">{item.status}</span>}
              </div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-cream md:text-5xl lg:text-6xl">
                {item.title}
              </h1>
              {item.tagline && <p className="mt-2 font-display text-lg italic text-cream/50">“{item.tagline}”</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[13px] text-cream/70">
                {item.rating != null && (
                  <span className="flex items-center gap-1 font-medium text-gold">
                    <Star size={13} fill="currentColor" /> {item.rating.toFixed(1)}
                    <span className="font-normal text-cream/40">({item.votes.toLocaleString()})</span>
                  </span>
                )}
                {item.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-cream/40" /> {item.year}
                  </span>
                )}
                {item.type === "movie" && item.runtime ? (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-cream/40" /> {runtime(item.runtime)}
                  </span>
                ) : item.seasons ? (
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-cream/40" />{" "}
                    {t("title.seasonCount", { count: item.seasons })}
                  </span>
                ) : null}
                {item.genres.map((g) => (
                  <span key={g} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-cream/60">
                    {g}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to={playTarget} className="btn btn-primary px-6">
                  <Play size={17} fill="currentColor" />
                  {item.type === "tv" && resume?.progress
                    ? t("title.resume", { code: episodeCode(resume.progress.season, resume.progress.episode) })
                    : t("title.play")}
                </Link>
                <button onClick={() => toggle("watchlist")} className="btn btn-ghost" aria-pressed={inWatchlist}>
                  {inWatchlist ? <Check size={17} className="text-gold" /> : <Bookmark size={17} />}
                  {t(inWatchlist ? "title.inWatchlist" : "title.watchlist")}
                </button>
                <button
                  onClick={() => toggle("favorite")}
                  className="btn btn-ghost px-3.5"
                  aria-pressed={isFavorite}
                  aria-label={t("title.toggleFavourite")}
                >
                  <Heart size={17} className={isFavorite ? "fill-ember text-ember" : ""} />
                </button>
                {item.trailerKey && (
                  <button onClick={() => setTrailer(item.trailerKey!)} className="btn btn-ghost">
                    <Play size={15} /> {t("title.trailer")}
                  </button>
                )}
                {item.type === "tv" && totalEpisodes > 0 && (
                  <button onClick={markSeries} className="btn btn-ghost" disabled={saving} aria-pressed={seriesWatched}>
                    <Check size={17} className={seriesWatched ? "text-emerald-400" : ""} />
                    {t(seriesWatched ? "title.unmarkEpisodes" : "title.markEpisodes")}
                  </button>
                )}
              </div>
              {item.type === "tv" && totalEpisodes > 0 && (
                <p className="mt-3 text-xs text-muted">
                  {t("title.watchedProgress", { watched: watchedEpisodes, total: totalEpisodes })}
                </p>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="shell mt-10 md:mt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:gap-16">
          <div className="min-w-0">
            <section>
              <h2 className="label mb-3">{t("title.storyline")}</h2>
              <p className="max-w-3xl text-[15px] leading-[1.85] text-cream/75">
                {item.overview || t("title.overviewEmpty")}
              </p>
            </section>

            {item.cast && item.cast.length > 0 && (
              <section className="mt-10">
                <h2 className="label mb-4 flex items-center gap-2">
                  <Users size={13} /> {t("title.cast")}
                </h2>
                <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:px-0">
                  {item.cast.map((person) => (
                    <div key={person.name} className="w-24 shrink-0 text-center">
                      <div className="mx-auto size-20 overflow-hidden rounded-full border border-white/10 bg-ink-800">
                        {person.photo ? (
                          <img src={person.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center font-display text-2xl text-gold/60">
                            {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium leading-snug text-cream/85">{person.name}</p>
                      {person.role && <p className="mt-0.5 line-clamp-2 text-[10px] text-muted">{person.role}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {item.type === "tv" && validSeasons.length > 0 && (
              <section className="mt-12">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="label">{t("title.seasons")}</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollStrip(-1)}
                      disabled={!edges.left}
                      aria-label={t("title.scrollLeft")}
                      className="grid size-7 place-items-center rounded-full border border-white/10 text-cream/70 transition hover:border-white/25 hover:text-cream disabled:opacity-25"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollStrip(1)}
                      disabled={!edges.right}
                      aria-label={t("title.scrollRight")}
                      className="grid size-7 place-items-center rounded-full border border-white/10 text-cream/70 transition hover:border-white/25 hover:text-cream disabled:opacity-25"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                {/* One compact row that really slides: swipe on touch, arrows on
                    desktop, snap per season. Keeps the episode list in view. */}
                <div ref={stripRef} className="no-scrollbar mt-3 flex snap-x gap-2.5 overflow-x-auto scroll-smooth pb-1">
                  {validSeasons.map((s) => {
                    const seen = countWatchedEpisodes(watchedSet, s.season, s.episodes);
                    const full = s.episodes > 0 && seen >= s.episodes;
                    return (
                      <button
                        key={s.season}
                        onClick={() => setSeason(s.season)}
                        aria-current={s.season === season ? "true" : undefined}
                        className={`group w-[88px] shrink-0 snap-start overflow-hidden rounded-lg border text-left transition sm:w-[100px] ${
                          s.season === season
                            ? "border-gold/60 bg-white/[0.06] ring-1 ring-gold/30"
                            : "border-white/[0.07] bg-ink-900/60 hover:border-white/20"
                        }`}
                        aria-pressed={s.season === season}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden bg-ink-800">
                          {s.poster ? (
                            <img src={s.poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-xs text-muted">{s.season}</span>
                          )}
                          {full && (
                            <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-emerald-500 text-ink-950">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <div className="px-1.5 py-1.5">
                          <p className={`truncate text-xs font-medium ${s.season === season ? "text-gold" : "text-cream/85"}`}>
                            {s.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {t("title.seasonEpisodes", { count: s.episodes })}
                            {s.year ? ` · ${s.year}` : ""}
                          </p>
                          <p className={`text-[10px] ${full || seen > 0 ? "text-emerald-400/80" : "text-muted"}`}>
                            {full ? t("title.seasonComplete") : t("title.seasonWatched", { watched: seen })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* The episode list gets its own heading, under the season grid. */}
                <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="label">{t("title.episodes")}</h2>
                  <p className="text-xs text-muted">
                    {currentSeason?.name}
                    {currentSeason ? " · " + t("title.seasonEpisodes", { count: currentSeason.episodes }) : ""}
                  </p>
                </div>

                {currentSeason?.overview && <p className="mt-3 max-w-3xl text-sm text-muted">{currentSeason.overview}</p>}

                <div className="mt-3 divide-y divide-white/[0.06]">
                  {seasonData.loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4 py-4">
                        <div className="skeleton aspect-video w-40 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="h-4 w-1/2 rounded bg-ink-800" />
                          <div className="h-3 w-3/4 rounded bg-ink-800/70" />
                        </div>
                      </div>
                    ))
                  ) : seasonData.error ? (
                    <p className="py-6 text-sm text-ember">{seasonData.error}</p>
                  ) : (
                    seasonData.data?.episodes.map((ep) => {
                      const seen = watchedSet.has(season + ":" + ep.episode);
                      const spot = stopPoints[season + ":" + ep.episode];
                      const spotPct =
                        spot && !seen && spot.duration > 0
                          ? Math.min(100, Math.max(0, (spot.position / spot.duration) * 100))
                          : 0;
                      return (
                      <div
                        key={ep.episode}
                        className="group flex gap-4 py-4 transition-colors hover:bg-white/[0.025]"
                      >
                        <Link
                          to={`/watch/tv/${item.id}?season=${season}&episode=${ep.episode}`}
                          className="flex min-w-0 flex-1 gap-4"
                        >
                          <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-ink-800 sm:w-44">
                            {ep.still ? (
                              <img src={ep.still} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-muted">{t("title.noStill")}</div>
                            )}
                            <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                              <span className="grid size-9 place-items-center rounded-full bg-cream text-ink-950">
                                <Play size={14} fill="currentColor" />
                              </span>
                            </span>
                            <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
                              {ep.episode}
                            </span>
                            {spotPct > 0 && (
                              <span className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
                                <span className="block h-full bg-gold" style={{ width: spotPct + "%" }} />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-medium text-cream group-hover:text-white">{ep.name}</h3>
                              <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted">
                                {ep.rating != null && (
                                  <span className="flex items-center gap-1 text-gold/80">
                                    <Star size={10} fill="currentColor" /> {ep.rating.toFixed(1)}
                                  </span>
                                )}
                                {ep.runtime ? (
                                  <span>
                                    {ep.runtime}
                                    {t("unit.minuteShort")}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                              {ep.overview || t("title.noDescription")}
                            </p>
                            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                              {ep.airDate && <span>{ep.airDate}</span>}
                              {spotPct > 0 && spot && (
                                <span className="flex items-center gap-1 text-gold/85">
                                  <Clock size={10} /> {t("title.stopPoint", { time: timecode(spot.position) })}
                                </span>
                              )}
                              {seen && (
                                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                  {t("title.episodeWatched")}
                                </span>
                              )}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => markEpisode(ep.episode, !seen, ep.runtime || item.runtime || 0)}
                          className="mt-0.5 grid size-8 shrink-0 place-items-center self-start rounded-full border border-white/10 text-cream/60 transition hover:border-emerald-400/40 hover:text-emerald-400"
                          aria-pressed={seen}
                          title={t(seen ? "title.unmarkEpisode" : "title.markEpisode")}
                          aria-label={t(seen ? "title.unmarkEpisode" : "title.markEpisode")}
                        >
                          <Check size={15} className={seen ? "text-emerald-400" : "opacity-40"} />
                        </button>
                      </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-5 lg:mt-2">
            <h2 className="label">{t("title.details")}</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("title.detailType")}</dt>
                <dd className="text-right text-cream/85">{mediaLabel(item.type)}</dd>
              </div>
              {item.year && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("title.detailReleased")}</dt>
                  <dd className="text-right text-cream/85">{item.year}</dd>
                </div>
              )}
              {item.type === "movie" && item.runtime ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("title.detailRuntime")}</dt>
                  <dd className="text-right text-cream/85">{runtime(item.runtime)}</dd>
                </div>
              ) : null}
              {item.seasons ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("title.detailSeasons")}</dt>
                  <dd className="text-right text-cream/85">{item.seasons}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("title.detailGenres")}</dt>
                <dd className="max-w-[60%] text-right text-cream/85">{item.genres.join(", ") || "—"}</dd>
              </div>
              {item.externalIds?.imdb && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">IMDb</dt>
                  <dd>
                    <a
                      href={`https://www.imdb.com/title/${item.externalIds.imdb}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
                    >
                      {item.externalIds.imdb}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <div className="border-t border-white/[0.07] pt-4 text-[11px] leading-relaxed text-muted">
              {t("title.attribution")}
            </div>
          </aside>
        </div>

        {item.recommendations && item.recommendations.length > 0 && (
          <div className="mt-14">
            <Row row={{ key: "recommendations", title: t("title.moreLikeThis"), items: item.recommendations }} />
          </div>
        )}
      </div>

      {trailer && <TrailerModal videoKey={trailer} title={item.title} onClose={() => setTrailer(null)} />}
    </article>
  );
}