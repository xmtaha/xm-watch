import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  ListVideo,
  RefreshCw,
  ShieldAlert,
  Star,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi, useDocumentTitle } from "../lib/hooks";
import type { Provider, Progress, SeasonResponse, Title } from "../lib/types";
import { episodeCode, mediaLabel, runtime, timecode } from "../lib/format";
import { useT } from "../lib/i18n";
import { providerNote } from "../lib/providers";
import { VideoPlayer } from "../player/VideoPlayer";
import { EmptyState, ErrorState } from "../components/States";
import { useToast } from "../components/Toast";

function useProviders(type: string, id: string, season: number, episode: number) {
  return useApi<{ providers: Provider[] }>(`/providers?type=${type}&id=${id}&season=${season}&episode=${episode}`);
}

export default function Watch() {
  const { type = "movie", id = "" } = useParams();
  const mediaType = type === "tv" ? "tv" : "movie";
  const [params, setParams] = useSearchParams();
  const season = Number(params.get("season") || (mediaType === "tv" ? 1 : 0));
  const episode = Number(params.get("episode") || (mediaType === "tv" ? 1 : 0));
  const toast = useToast();
  const t = useT();

  const detail = useApi<Title>(`/title/${mediaType}/${id}`);
  const progressList = useApi<{ continueWatching: Title[] }>("/progress");
  const sources = useProviders(mediaType, id, season, episode);
  const seasonData = useApi<SeasonResponse>(mediaType === "tv" ? `/title/tv/${id}/season/${season}` : null);

  const [providerId, setProviderId] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [probe, setProbe] = useState<{ status: "idle" | "checking" | "ok" | "down" | "blocked" | "unknown"; detail: string }>({
    status: "idle",
    detail: "",
  });
  const [touched, setTouched] = useState(0);
  const [live, setLive] = useState<{ position: number; duration: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeTimer = useRef<number | null>(null);
  const lastSaved = useRef(0);

  const item = detail.data;
  const providers = sources.data?.providers ?? [];
  const provider = providers.find((p) => p.id === providerId) ?? providers[0];
  const episodes = seasonData.data?.episodes ?? [];
  const currentEpisode = episodes.find((e) => e.episode === episode);
  const index = episodes.findIndex((e) => e.episode === episode);

  useDocumentTitle(
    item ? `${t("watch.title")} ${item.title}${currentEpisode ? ` · ${episodeCode(season, episode)}` : ""}` : null,
  );

  useEffect(() => {
    setProviderId(null);
    setFailed([]);
    setLive(null);
  }, [season, episode, mediaType, id]);

  useEffect(() => {
    if (!providerId && providers.length) setProviderId(providers[0].id);
  }, [providers, providerId]);

  const saved: Progress | undefined = useMemo(() => {
    const entry = progressList.data?.continueWatching.find((e) => e.type === mediaType && String(e.id) === id);
    if (!entry?.progress) return undefined;
    if (mediaType === "tv" && (entry.progress.season !== season || entry.progress.episode !== episode)) return undefined;
    return entry.progress;
  }, [progressList.data, mediaType, id, season, episode]);

  // Resume from THIS episode's own stop point: the continue list only knows the
  // newest row per title, so it cannot answer "where was I in S2E5?".
  const stopPoints = useMemo(() => api.episodeStopPoints(mediaType, Number(id)), [mediaType, id, touched]);
  const spot = stopPoints[season + ":" + episode];
  const resumeFrom =
    spot && !spot.watched && spot.position > 10
      ? spot.position
      : saved && !saved.watched && saved.position > 10
        ? saved.position
        : 0;
  const startAt = resumeFrom ? resumeFrom - 4 : 0;
  const played = live ?? (spot && !spot.watched && spot.position > 10 ? { position: spot.position, duration: spot.duration } : null);
  const remaining = played && played.duration > played.position ? played.duration - played.position : 0;


  // Watched flags for this season — the single source for the player and the list.
  // This screen only ever marks the episode it is playing, never the whole series.
  const seen = useMemo(
    () => new Set(api.watchedEpisodes(mediaType, Number(id), season)),
    [mediaType, id, season, touched],
  );
  const isWatched = seen.has(episode);

  useEffect(() => {
    if (!provider) {
      setProbe({ status: "idle", detail: "" });
      return;
    }
    let alive = true;
    setProbe({ status: "checking", detail: "" });
    api
      .checkProvider(provider.url)
      .then((res) => alive && setProbe(res))
      .catch((err: Error) => alive && setProbe({ status: "unknown", detail: err.message }));
    return () => {
      alive = false;
    };
  }, [provider?.id, provider?.url]);

  const advance = (reason: string) => {
    if (!provider) return;
    const remaining = providers.filter((p) => p.id !== provider.id && !failed.includes(p.id));
    setFailed((prev) => [...prev, provider.id]);
    if (remaining.length) {
      setProviderId(remaining[0].id);
      toast(t("watch.switching", { from: provider.name, to: remaining[0].name }), "info");
    } else {
      toast(t("watch.noOtherSources", { reason }), "error");
    }
  };

  useEffect(() => {
    if (!provider || provider.kind !== "iframe") return;
    if (iframeTimer.current) window.clearTimeout(iframeTimer.current);
    iframeTimer.current = window.setTimeout(() => {
      advance(t("watch.timeoutReason"));
    }, 20_000);
    return () => {
      if (iframeTimer.current) window.clearTimeout(iframeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id, reloadKey]);

  const savePosition = (position: number, duration: number, force = false) => {
    if (!provider || provider.kind === "iframe") return;
    const now = Date.now();
    if (!force && now - lastSaved.current < 5000) return;
    lastSaved.current = now;
    api
      .saveProgress({ type: mediaType, id: Number(id), season, episode, position, duration })
      .catch(() => {});
  };

  const saveWatched = async (targetEpisode: number, next: boolean, duration = 0) => {
    try {
      await api.saveProgress({
        type: mediaType,
        id: Number(id),
        season,
        episode: targetEpisode,
        position: 0,
        duration: next ? duration : 0,
        watched: next,
      });
      setTouched((n) => n + 1);
      progressList.reload();
      toast(t(next ? "watch.markedWatched" : "watch.markedUnwatched"));
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const setEpisodeWatched = async (next: boolean) =>
    saveWatched(episode, next, currentEpisode?.runtime ?? item?.runtime ?? 0);

  // Rows in the sidebar belong to the loaded season, which may differ from ?season=.
  const markListedEpisode = (targetEpisode: number, next: boolean, duration: number) =>
    saveWatched(targetEpisode, next, duration);



  const changeSeason = (nextSeason: number) => {
    setParams({ season: String(nextSeason), episode: "1" });
  };

  const prev = index > 0 ? episodes[index - 1] : null;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null;

  if (detail.error && !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24">
        <ErrorState message={detail.error} onRetry={detail.reload} />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1560px] items-center gap-4 px-3 md:h-16 md:px-6">
          <Link
            to={item ? `/title/${mediaType}/${id}` : "/"}
            className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-cream/80 transition hover:bg-white/5 hover:text-cream"
          >
            <ArrowLeft size={14} /> {t("watch.back")}
          </Link>
          <span className="hidden truncate text-sm text-cream/70 sm:block">
            {item?.title ?? t("watch.loading")}
            {item?.type === "tv" && <span className="text-muted"> · {episodeCode(season, episode)}</span>}
          </span>
          <Link to="/" className="ml-auto flex items-baseline gap-0.5">
            <span className="font-display text-xl text-cream">Cineflow</span>
            <span className="mb-0.5 size-1.5 rounded-full bg-gold" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1560px] px-3 py-4 md:px-6 md:py-6">
        <div className={`grid gap-6 lg:items-start ${item?.type === "tv" ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl bg-black">
              {sources.loading && !providers.length ? (
                <div className="skeleton aspect-video w-full rounded-xl" />
              ) : !provider ? (
                <div className="grid aspect-video w-full place-items-center rounded-xl border border-white/10 bg-ink-900 p-6">
                  <EmptyState
                    icon={<ListVideo size={20} />}
                    title={t("watch.noSources")}
                    description={t("watch.noSourcesBody")}
                    action={
                      <Link to="/settings#providers" className="btn btn-gold">
                        {t("watch.configure")}
                      </Link>
                    }
                  />
                </div>
              ) : provider.kind === "iframe" ? (
                <div className="relative">
                  {/* No referrerPolicy override: the browser default
                      (strict-origin-when-cross-origin) is what these players
                      expect, and stripping the Referer header makes some of
                      them never load their subtitle track. */}
                  <iframe
                    key={`${provider.id}-${reloadKey}`}
                    src={provider.url}
                    title={`${item?.title ?? t("watch.title")} — ${provider.name}`}
                    className="aspect-video w-full border-0 bg-black"
                    /* EmbedMaster's docs ask for the "*" form (and forbid a
                       sandbox attribute); the wildcard also lets the other
                       players go fullscreen without a same-origin match. */
                    allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
                    allowFullScreen
                    onLoad={() => {
                      if (iframeTimer.current) window.clearTimeout(iframeTimer.current);
                      setProbe((p) =>
                        p.status === "checking" ? { ...p, status: "unknown", detail: t("watch.loadedInBrowser") } : p,
                      );
                    }}
                  />
                </div>
              ) : (
                <VideoPlayer
                  key={`${provider.id}-${reloadKey}`}
                  src={provider.url}
                  poster={item?.backdrop ?? item?.poster}
                  title={item?.title ?? t("watch.title")}
                  startAt={startAt}
                  onProgress={(position, duration) => {
                    setLive({ position, duration });
                    savePosition(position, duration);
                  }}
                  onEnded={() => {
                    setEpisodeWatched(true);
                    if (next) toast(t("watch.upNext", { code: episodeCode(season, next.episode), name: next.name }));
                  }}
                  onFatalError={(message) => advance(message)}
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label mb-1.5 text-gold/80">
                  {item ? mediaLabel(item.type) : t("watch.nowPlaying")}
                  {item?.type === "tv" && currentEpisode ? ` · ${episodeCode(season, episode)}` : ""}
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight text-cream md:text-2xl">
                  {item?.type === "tv" ? (currentEpisode?.name ?? item?.title) : (item?.title ?? t("watch.loading"))}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {item?.rating != null && (
                    <span className="flex items-center gap-1 text-gold">
                      <Star size={11} fill="currentColor" /> {item.rating.toFixed(1)}
                    </span>
                  )}
                  {item?.year && <span>{item.year}</span>}
                  {currentEpisode?.runtime ? <span>{runtime(currentEpisode.runtime)}</span> : item?.runtime ? <span>{runtime(item.runtime)}</span> : null}
                  {remaining > 0 && (
                    <span className="flex items-center gap-1 text-gold/85">
                      <Clock size={11} /> {t("watch.remaining", { time: timecode(remaining) })}
                    </span>
                  )}
                  {item?.demo && (
                    <span className="rounded border border-gold/25 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold/60">
                      {t("meta.demo")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {item?.type === "tv" && (
                  <Link
                    to={`/title/tv/${id}`}
                    className="btn btn-ghost px-3 py-2 text-xs"
                  >
                    <ListVideo size={14} /> {t("title.episodes")}
                  </Link>
                )}
                <button
                  onClick={() => setEpisodeWatched(!isWatched)}
                  className="btn btn-ghost px-3 py-2 text-xs"
                  aria-pressed={isWatched}
                >
                  <CheckCircle2 size={14} className={isWatched ? "text-emerald-400" : ""} />
                  {t(isWatched ? "watch.watched" : "watch.markWatched")}
                </button>
              </div>
            </div>

            {(currentEpisode?.overview || item?.overview) && (
              <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">
                {currentEpisode?.overview || item?.overview}
              </p>
            )}

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-ink-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="label">{t("watch.sources")}</p>
                {provider && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <span
                      className={`size-1.5 rounded-full ${
                        probe.status === "checking"
                          ? "animate-pulse bg-gold"
                          : probe.status === "ok"
                            ? "bg-emerald-400"
                            : probe.status === "blocked" || probe.status === "down"
                              ? "bg-ember"
                              : "bg-white/30"
                      }`}
                    />
                    {probe.status === "checking"
                      ? t("watch.checkingAvailability")
                      : probe.status === "ok"
                        ? t("watch.statusUp")
                        : probe.status === "blocked"
                          ? t("watch.probeBlocked")
                          : probe.status === "down"
                            ? t("watch.probeDown")
                            : probe.status === "unknown"
                              ? probe.detail || t("watch.notVerified")
                              : ""}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {sources.loading && !providers.length && (
                  <span className="text-xs text-muted">{t("watch.loadingSources")}</span>
                )}
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProviderId(p.id);
                      setReloadKey((k) => k + 1);
                    }}
                    className={`chip ${failed.includes(p.id) ? "opacity-60" : ""}`}
                    data-active={provider?.id === p.id}
                  >
                    {p.name}
                    {failed.includes(p.id) && <ShieldAlert size={12} className="text-ember" />}
                  </button>
                ))}
                {provider && (
                  <button onClick={() => setReloadKey((k) => k + 1)} className="chip" aria-label={t("watch.sourceReload")}>
                    <RefreshCw size={12} /> {t("watch.reload")}
                  </button>
                )}
              </div>

              {provider && (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <p className="text-[11px] leading-relaxed text-muted/80">
                    {provider.kind === "iframe" ? (
                      <>
                        <span className="text-cream/70">{t("watch.externalPlayer")}</span>{" "}
                        {t("watch.externalPlayerBody", { name: provider.name })}
                      </>
                    ) : (
                      <>
                        <span className="text-cream/70">{t("watch.directStream")}</span> {t("watch.directStreamBody")}
                      </>
                    )}
                    {provider.note ? ` ${providerNote(provider.note)}` : ""}
                    {item?.demo && provider.kind === "iframe" ? ` ${t("watch.demoIdNote")}` : ""}
                  </p>
                  {failed.includes(provider.id) && (
                    <button onClick={() => setReloadKey((k) => k + 1)} className="mt-2 text-[11px] text-gold underline underline-offset-4">
                      {t("watch.retry")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {item?.type === "tv" && (
              <div className="mt-4 flex items-center justify-between gap-3">
                {prev ? (
                  <Link
                    to={`/watch/tv/${id}?season=${season}&episode=${prev.episode}`}
                    className="btn btn-ghost min-w-0 flex-1 justify-start px-3 py-2.5 text-xs sm:text-sm"
                  >
                    <ChevronLeft size={16} className="shrink-0" />
                    <span className="truncate">
                      <span className="text-muted">{t("watch.previousLabel")} </span>
                      {prev.name}
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
                {next ? (
                  <Link
                    to={`/watch/tv/${id}?season=${season}&episode=${next.episode}`}
                    className="btn btn-ghost min-w-0 flex-1 justify-end px-3 py-2.5 text-xs sm:text-sm"
                  >
                    <span className="truncate">
                      <span className="text-muted">{t("watch.nextLabel")} </span>
                      {next.name}
                    </span>
                    <ChevronRight size={16} className="shrink-0" />
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
              </div>
            )}
          </div>

          {item?.type === "tv" && (
            <aside className="rounded-xl border border-white/[0.07] bg-ink-900/50 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                <p className="label">{t("title.episodes")}</p>
                {item.seasonList && item.seasonList.filter((s) => s.season > 0).length > 1 && (
                  <select
                    value={season}
                    onChange={(e) => changeSeason(Number(e.target.value))}
                    className="field w-auto py-1.5 text-xs"
                    aria-label={t("watch.seasonPicker")}
                  >
                    {item.seasonList
                      .filter((s) => s.season > 0)
                      .map((s) => (
                        <option key={s.season} value={s.season}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
              {seasonData.loading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              ) : seasonData.error ? (
                <p className="p-4 text-xs text-ember">{seasonData.error}</p>
              ) : (
                <ol className="p-2">
                  {episodes.map((ep) => {
                    const current = ep.episode === episode;
                    const row = stopPoints[season + ":" + ep.episode];
                    const rowPct =
                      row && !seen.has(ep.episode) && row.duration > 0
                        ? Math.min(100, Math.max(0, (row.position / row.duration) * 100))
                        : 0;
                    return (
                      <li key={ep.episode} className="flex items-center gap-1">
                        <Link
                          to={`/watch/tv/${id}?season=${season}&episode=${ep.episode}`}
                          className={`flex min-w-0 flex-1 gap-3 rounded-lg p-2 transition ${current ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                          aria-current={current}
                        >
                          <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-ink-800">
                            {ep.still ? (
                              <img src={ep.still} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : null}
                            <span className="absolute inset-0 grid place-items-center bg-black/30 text-[11px] font-medium text-white/80">
                              {ep.episode}
                            </span>
                            {seen.has(ep.episode) && (
                              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-ink-950">
                                <CheckCircle2 size={10} />
                              </span>
                            )}
                            {rowPct > 0 && (
                              <span className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
                                <span className="block h-full bg-gold" style={{ width: rowPct + "%" }} />
                              </span>
                            )}
                            {current && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />}
                          </div>
                          <div className="min-w-0 py-0.5">
                            <p className={`line-clamp-2 text-xs font-medium leading-snug ${current ? "text-gold" : "text-cream/85"}`}>
                              {ep.name}
                            </p>
                            <p className="mt-1 text-[10px] text-muted">
                              {ep.runtime ? `${ep.runtime}${t("unit.minuteShort")}` : ""}{" "}
                              {ep.rating ? `· ${ep.rating.toFixed(1)}★` : ""}
                            </p>
                            {rowPct > 0 && row && (
                              <span className="mt-1 flex items-center gap-1 text-[10px] text-gold/85">
                                <Clock size={9} /> {t("title.stopPoint", { time: timecode(row.position) })}
                              </span>
                            )}
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => markListedEpisode(ep.episode, !seen.has(ep.episode), ep.runtime || 0)}
                          className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 text-cream/50 transition hover:border-emerald-400/40 hover:text-emerald-400"
                          aria-pressed={seen.has(ep.episode)}
                          title={t(seen.has(ep.episode) ? "title.unmarkEpisode" : "title.markEpisode")}
                          aria-label={t(seen.has(ep.episode) ? "title.unmarkEpisode" : "title.markEpisode")}
                        >
                          <CheckCircle2 size={13} className={seen.has(ep.episode) ? "text-emerald-400" : "opacity-40"} />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </aside>
          )}
        </div>

        <div className="mt-8 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Info size={13} className="mt-0.5 shrink-0" />
          <p>{t("watch.disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}
