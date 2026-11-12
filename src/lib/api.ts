/**
 * Client-side data layer.
 *
 * The app used to talk to an Express API (`/api/...`). There is no server any
 * more: every call is served here, from TMDB directly (with the key stored in
 * this browser) or from the offline demo catalogue. Path-based routing is kept
 * so components can keep using `useApi("/title/movie/603")` as a cache key.
 */
import { demoGenres, demoHome, demoList, demoRecommendations, demoSeason, demoTitle } from "./demo";
import { ApiError } from "./errors";
import { t } from "./i18n";
import {
  checkProvider as probeProvider,
  getProvidersConfig,
  publicProviderConfig,
  resetProvidersConfig as resetProviderConfig,
  resolveProviders,
  saveProvidersConfig,
} from "./providers";
import {
  clearProgressRecord,
  continueWatchingEntries,
  decorateContinue,
  favouriteSummaries,
  hasLibrary,
  libraryRows,
  saveProgressRecord,
  setLibrary,
  setTitleWatched,
  summaries,
  watchedInSeason,
  watchedKeys,
  episodePositions,
  withContinue,
} from "./store";
import {
  clearCache,
  clearKey,
  discover as discoverTmdb,
  getGenres,
  getHome,
  getKey,
  getSeason,
  getTitle,
  isDemo,
  recommendationsFor,
  saveKey,
  search as searchTmdb,
  validateKey,
} from "./tmdb";
import type { HomeResponse, MediaType, Page, Provider, ProviderConfig, SeasonResponse, Status, Title } from "./types";

export { ApiError };

const typeOf = (value: string | null | undefined): MediaType => {
  if (value !== "movie" && value !== "tv") throw new ApiError(t("error.type"), 400);
  return value;
};

// TMDB ids are int32 and already above 1,000,000 for 2025+ releases, so the
// upper bound must stay well clear of them; only `min` separates demo ids.
const intOf = (value: string | number | null | undefined, name: string, min = -1_000_000, max = 2_147_483_647): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(t("error.invalidField", { name }), 400);
  return n;
};

const qs = (params: Record<string, string | number | undefined | null>): URLSearchParams => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  return search;
};

/* ---------------------------------------------------------------- endpoints */

async function status(): Promise<Status> {
  return { demo: isDemo(), hasKey: Boolean(getKey()), providers: getProvidersConfig().providers.length };
}

async function home(): Promise<HomeResponse> {
  if (isDemo()) {
    const demo = demoHome();
    return { demo: true, trending: demo.trending, rows: withContinue(demo.rows, await continueWatchingEntries()) };
  }
  const [catalogue, favourites] = await Promise.all([getHome(), favouriteSummaries()]);
  const rows = [...catalogue.rows];
  if (favourites.length) {
    try {
      const seed = favourites[Math.floor(Math.random() * favourites.length)];
      const recs = await recommendationsFor(seed.type, seed.id);
      if (recs.length) rows.splice(2, 0, { key: "for-you", title: t("home.row.becauseYouLiked", { title: seed.title }), items: recs });
    } catch {
      /* recommendations are a bonus row */
    }
  }
  return { demo: false, trending: catalogue.trending, rows: withContinue(rows, await continueWatchingEntries()) };
}

async function discover(
  type: MediaType,
  params: {
    page?: number;
    genre?: string;
    sort?: string;
    year?: string;
    rating?: string;
    runtimeGte?: number;
    runtimeLte?: number;
  },
): Promise<Page<Title>> {
  const page = intOf(params.page ?? 1, "page", 1, 500);
  if (isDemo()) {
    return { ...demoList(type, { page, genre: params.genre, sort: params.sort }), demo: true };
  }
  return discoverTmdb(type, {
    page,
    genre: params.genre ?? "",
    sort: params.sort ?? "popularity",
    year: params.year ?? "",
    rating: params.rating ?? "",
    runtimeGte: params.runtimeGte ?? 0,
    runtimeLte: params.runtimeLte ?? 0,
  });
}

async function search(params: {
  q: string;
  page?: number;
  type?: string;
  genre?: string;
  year?: string;
  rating?: string;
}): Promise<Page<Title>> {
  const query = String(params.q || "").slice(0, 120);
  const type = params.type === "movie" || params.type === "tv" ? params.type : "all";
  const page = intOf(params.page ?? 1, "page", 1, 500);

  if (isDemo()) {
    const filters = { page, search: query, genre: params.genre, sort: "popularity" };
    if (type === "all") {
      const movies = demoList("movie", filters);
      const tv = demoList("tv", filters);
      return { page: 1, totalPages: 1, results: [...movies.results, ...tv.results], demo: true };
    }
    return { ...demoList(type, filters), demo: true };
  }
  return searchTmdb(query, {
    page,
    type,
    genre: params.genre ?? "",
    year: params.year ?? "",
    rating: params.rating ?? "",
  });
}

async function genres(type: MediaType): Promise<{ genres: { id: string; name: string }[] }> {
  if (isDemo()) return { genres: demoGenres() };
  return { genres: await getGenres(type) };
}

async function title(type: MediaType, id: number | string): Promise<Title> {
  const mediaId = intOf(id, "id");
  if (mediaId < 0) {
    const item = demoTitle(type, mediaId);
    if (!item) throw new ApiError(t("error.titleNotFound"), 404);
    item.inWatchlist = hasLibrary(type, mediaId, "watchlist");
    item.isFavorite = hasLibrary(type, mediaId, "favorite");
    return { ...item, recommendations: demoRecommendations(type, mediaId) };
  }
  if (isDemo()) throw new ApiError(t("error.noKey"), 404);
  const item = await getTitle(type, mediaId);
  item.inWatchlist = hasLibrary(type, mediaId, "watchlist");
  item.isFavorite = hasLibrary(type, mediaId, "favorite");
  return item;
}

async function season(id: number | string, seasonNumber: number): Promise<SeasonResponse & { demo?: boolean }> {
  const mediaId = intOf(id, "id");
  const num = intOf(seasonNumber, "season", 0, 100);
  if (mediaId < 0) {
    const data = demoSeason("tv", mediaId, num);
    if (!data) throw new ApiError(t("error.seasonNotFound"), 404);
    return { ...data, demo: true };
  }
  if (isDemo()) throw new ApiError(t("error.noKeySeasons"), 404);
  return getSeason(mediaId, num);
}

async function library(): Promise<{ watchlist: Title[]; favorites: Title[] }> {
  const rows = libraryRows();
  return {
    watchlist: await summaries(rows.filter((row) => row.list === "watchlist")),
    favorites: await summaries(rows.filter((row) => row.list === "favorite")),
  };
}

/** Episode numbers marked watched in one season (empty for films). */
function watchedEpisodes(type: MediaType, id: number, seasonNumber: number): number[] {
  return watchedInSeason(typeOf(type), intOf(id, "id"), intOf(seasonNumber, "season", 0, 100));
}

/** Every "season:episode" key marked watched for one title. */
function watchedEpisodeKeys(type: MediaType, id: number): string[] {
  return watchedKeys(typeOf(type), intOf(id, "id"));
}

/** Stored stop point per "season:episode" — how far into each episode the user got. */
function episodeStopPoints(type: MediaType, id: number) {
  return episodePositions(typeOf(type), intOf(id, "id"));
}

/** Series-level watched switch: all episodes at once, or every mark cleared. */
async function markTitleWatched(body: {
  type: MediaType;
  id: number;
  watched: boolean;
  episodes?: { season: number; episode: number; duration?: number }[];
}) {
  setTitleWatched(typeOf(body?.type), intOf(body?.id, "id"), Boolean(body?.watched), body?.episodes ?? []);
  return { ok: true };
}

async function progress(): Promise<{ continueWatching: Title[] }> {
  return { continueWatching: decorateContinue(await continueWatchingEntries()) };
}

async function providers(
  type: MediaType,
  id: number | string,
  seasonNumber = 0,
  episode = 0,
): Promise<{ providers: Provider[] }> {
  const mediaId = intOf(id, "id");
  const ctx = {
    id: mediaId,
    type,
    season: intOf(seasonNumber, "season", 0, 100),
    episode: intOf(episode, "episode", 0, 10_000),
  };
  if (!isDemo() && mediaId > 0) {
    let imdbId: string | null = null;
    try {
      imdbId = (await getTitle(type, mediaId)).externalIds?.imdb ?? null;
    } catch {
      /* a provider that needs IMDb ids simply won't resolve */
    }
    return { providers: resolveProviders({ ...ctx, imdbId }, { demo: false }) };
  }
  return { providers: resolveProviders(ctx, { demo: true }) };
}

async function toggleLibrary(type: MediaType, id: number, list: "watchlist" | "favorite", add: boolean) {
  if (list !== "watchlist" && list !== "favorite") throw new ApiError(t("error.listNotFound"), 400);
  const mediaId = intOf(id, "id");
  return { ok: true, inList: setLibrary(type, mediaId, list, add) };
}

async function saveProgress(body: {
  type: MediaType;
  id: number;
  season?: number;
  episode?: number;
  position?: number;
  duration?: number;
  watched?: boolean;
}) {
  const type = typeOf(body?.type);
  const id = intOf(body?.id, "id");
  saveProgressRecord({ ...body, type, id });
  return { ok: true };
}

async function clearProgress(type: MediaType, id: number) {
  clearProgressRecord(typeOf(type), intOf(id, "id"));
  return { ok: true };
}

async function saveTmdbKey(key: string) {
  const trimmed = String(key || "").trim();
  await validateKey(trimmed);
  saveKey(trimmed);
  return { ok: true, demo: isDemo() };
}

async function clearTmdbKey() {
  clearKey();
  clearCache();
  return { ok: true, demo: isDemo() };
}

/* ------------------------------------------------------------------ router */

/**
 * Same paths the Express API used to expose, so `useApi(path)` keeps working and
 * the path doubles as a stable cache key.
 */
async function route<T>(path: string): Promise<T> {
  const [rawPath, rawQuery = ""] = path.split("?");
  const params = new URLSearchParams(rawQuery);
  const segments = rawPath.split("/").filter(Boolean);
  const at = (index: number): string | undefined => segments[index];

  if (segments.length === 1) {
    switch (segments[0]) {
      case "status":
        return (await status()) as unknown as T;
      case "home":
        return (await home()) as unknown as T;
      case "genres":
        return (await genres(typeOf(params.get("type") ?? "movie"))) as unknown as T;
      case "discover":
        return (await discover(typeOf(params.get("type") ?? "movie"), {
          page: params.get("page") ? Number(params.get("page")) : undefined,
          genre: params.get("genre") ?? undefined,
          sort: params.get("sort") ?? undefined,
          year: params.get("year") ?? undefined,
          rating: params.get("rating") ?? undefined,
        })) as unknown as T;
      case "search":
        return (await search({
          q: params.get("q") ?? "",
          page: params.get("page") ? Number(params.get("page")) : undefined,
          type: params.get("type") ?? undefined,
          genre: params.get("genre") ?? undefined,
          year: params.get("year") ?? undefined,
          rating: params.get("rating") ?? undefined,
        })) as unknown as T;
      case "library":
        return (await library()) as unknown as T;
      case "progress":
        return (await progress()) as unknown as T;
      case "providers":
        return (await providers(
          typeOf(params.get("type") ?? "movie"),
          params.get("id") ?? "0",
          params.get("season") ? Number(params.get("season")) : 0,
          params.get("episode") ? Number(params.get("episode")) : 0,
        )) as unknown as T;
      default:
        break;
    }
  }

  if (segments[0] === "title") {
    const mediaType = typeOf(at(1));
    if (segments.length === 3) return (await title(mediaType, at(2) ?? "")) as unknown as T;
    if (segments.length === 5 && at(3) === "season") {
      return (await season(at(2) ?? "", Number(at(4)))) as unknown as T;
    }
  }

  if (segments[0] === "settings" && at(1) === "providers") {
    return publicProviderConfig() as unknown as T;
  }

  throw new ApiError(t("error.unknownEndpoint", { path }), 404);
}

export const api = {
  get: route,
  status,
  home,
  discover,
  search,
  genres,
  title,
  season,
  library,
  toggleLibrary,
  progress,
  watchedEpisodes,
  watchedEpisodeKeys,
  episodeStopPoints,
  saveProgress,
  markTitleWatched,
  clearProgress,
  providers,
  checkProvider: (url: string) => probeProvider(url),
  saveTmdbKey,
  clearTmdbKey,
  providersConfig: async (): Promise<{ path: string; providers: ProviderConfig[] }> => publicProviderConfig(),
  saveProvidersConfig: async (list: ProviderConfig[]): Promise<{ providers: ProviderConfig[] }> => saveProvidersConfig(list),
  resetProvidersConfig: async (): Promise<{ providers: ProviderConfig[] }> => resetProviderConfig(),
  qs,
};
