/**
 * TMDB client for the browser.
 *
 * The key lives in localStorage (or is baked in at build time with
 * VITE_TMDB_API_KEY) and requests go straight to api.themoviedb.org, which
 * sends permissive CORS headers. Responses are cached in localStorage so the
 * rate limit is respected without a server-side cache.
 */
import { ApiError } from "./errors";
import { getLang, t, tmdbLanguage, type Lang } from "./i18n";
import type { MediaType, Page, SeasonResponse, Title } from "./types";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const KEY_STORAGE = "cineflow:tmdb-key:v1";
const CACHE_PREFIX = "cineflow:cache:v1:";
const CACHE_BUDGET = 120; // entries, oldest evicted first

const ENV_KEY = (import.meta.env.VITE_TMDB_API_KEY || "").trim();

export function getKey(): string {
  if (ENV_KEY) return ENV_KEY;
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export const isDemo = (): boolean => !getKey();

export function hasEnvKey(): boolean {
  return Boolean(ENV_KEY);
}

export async function validateKey(key: string): Promise<void> {
  if (!key || key.length < 8) throw new ApiError(t("error.keyFormat"), 400);
  await tmdbRequest(key, "/configuration", {}, 0);
}

export function saveKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) throw new ApiError(t("error.keyEmpty"), 400);
  try {
    localStorage.setItem(KEY_STORAGE, trimmed);
  } catch {
    throw new ApiError(t("error.keyStorage"), 500);
  }
  clearCache();
}

export function clearKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable — nothing to clear */
  }
  clearCache();
}

/* ------------------------------------------------------------------ cache */

interface CacheRow {
  body: unknown;
  expires: number;
}

const memory = new Map<string, CacheRow>();

function cacheOrder(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key.slice(CACHE_PREFIX.length));
    }
  } catch {
    /* ignore */
  }
  return keys;
}

function cacheGet<T>(key: string): T | null {
  const hit = memory.get(key);
  if (hit) {
    if (hit.expires > Date.now()) return hit.body as T;
    memory.delete(key);
  }
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const row = JSON.parse(raw) as CacheRow;
    if (row.expires > Date.now()) {
      memory.set(key, row);
      return row.body as T;
    }
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    /* unreadable entry — treat as a miss */
  }
  return null;
}

function cacheSet(key: string, body: unknown, ttlMs: number): void {
  const row: CacheRow = { body, expires: Date.now() + ttlMs };
  memory.set(key, row);
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(row));
    const keys = cacheOrder();
    if (keys.length > CACHE_BUDGET) {
      for (const stale of keys.slice(0, keys.length - CACHE_BUDGET)) localStorage.removeItem(CACHE_PREFIX + stale);
    }
  } catch {
    // Quota exceeded: keep the in-memory copy only.
    clearPersistedCache();
  }
}

function clearPersistedCache(): void {
  try {
    for (const key of cacheOrder()) localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearCache(): void {
  memory.clear();
  clearPersistedCache();
}

/* ---------------------------------------------------------------- request */

type Params = Record<string, string | number | boolean | undefined | null>;

async function tmdbRequest<T>(key: string, path: string, params: Params = {}, ttlMs = 0): Promise<T> {
  // Every response is requested in the interface language, so a language switch
  // changes the query — and therefore the cache key — instead of serving English.
  const query: Params = { ...params, language: tmdbLanguage() };
  const cacheKey = `${path}:${JSON.stringify(query)}`;
  if (ttlMs) {
    const hit = cacheGet<T>(cacheKey);
    if (hit) return hit;
  }

  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const bearer = key.length > 60;
  if (!bearer) url.searchParams.set("api_key", key);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: bearer ? { Authorization: `Bearer ${key}`, accept: "application/json" } : { accept: "application/json" },
    });
  } catch {
    throw new ApiError(t("error.tmdbNetwork"), 0);
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ApiError(t("error.tmdbKey"), 401);
    }
    if (res.status === 429) throw new ApiError(t("error.tmdbRate"), 429);
    throw new ApiError(`${t("error.tmdbGeneric")} (${res.status})`, res.status);
  }
  const data = (await res.json()) as T;
  if (ttlMs) cacheSet(cacheKey, data, ttlMs);
  return data;
}

const request = <T>(path: string, params: Params = {}, ttlMs = 0): Promise<T> =>
  tmdbRequest<T>(getKey(), path, params, ttlMs);

const HOUR = 3_600_000;
const TTL = { list: 3 * HOUR, detail: 12 * HOUR, season: 12 * HOUR, genres: 7 * 24 * HOUR, search: 1 * HOUR };

/* ------------------------------------------------------------ normalising */

interface RawItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  runtime?: number | null;
  number_of_seasons?: number | null;
}

interface RawCast {
  name: string;
  character: string;
  profile_path: string | null;
}

interface RawSeason {
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string | null;
}

interface RawDetail extends RawItem {
  genres?: { id: number; name: string }[];
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  imdb_id?: string | null;
  external_ids?: { imdb_id?: string | null };
  credits?: { cast?: RawCast[] };
  videos?: { results?: { site: string; type: string; key: string }[] };
  recommendations?: { results?: RawItem[] };
  seasons?: RawSeason[];
}

interface RawList<T> {
  page?: number;
  total_pages?: number;
  results?: T[];
}

const img = (path: string | null | undefined, size: string): string | null => (path ? `${IMG}/${size}${path}` : null);

const GENRE_NAMES: Record<Lang, Record<MediaType, Record<number, string>>> = {
  en: {
    movie: { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western" },
    tv: { 10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Science Fiction", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western" },
  },
  // List endpoints (discover, trending) return genre ids, not names, so the
  // fallback map has to exist per language as well.
  tr: {
    movie: { 28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç", 99: "Belgesel", 18: "Dram", 10751: "Aile", 14: "Fantastik", 36: "Tarih", 27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik", 878: "Bilim Kurgu", 10770: "TV Filmi", 53: "Gerilim", 10752: "Savaş", 37: "Vestern" },
    tv: { 10759: "Aksiyon ve Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç", 99: "Belgesel", 18: "Dram", 10751: "Aile", 10762: "Çocuk", 9648: "Gizem", 10763: "Haber", 10764: "Reality", 10765: "Bilim Kurgu", 10766: "Pembe Dizi", 10767: "Talk", 10768: "Savaş ve Politika", 37: "Vestern" },
  },
};

export function genreName(type: MediaType, id: number): string {
  const names = GENRE_NAMES[getLang()] ?? GENRE_NAMES.en;
  return names[type]?.[id] ?? names.movie[18];
}

export function normalise(item: RawItem, forcedType?: MediaType): Title {
  const type: MediaType = forcedType || (item.media_type === "tv" || item.first_air_date ? "tv" : "movie");
  const date = item.release_date || item.first_air_date || "";
  return {
    id: item.id,
    type,
    title: item.title || item.name || t("meta.untitled"),
    overview: item.overview || "",
    poster: img(item.poster_path, "w500"),
    backdrop: img(item.backdrop_path, "w1280"),
    year: date ? Number(date.slice(0, 4)) : null,
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    votes: item.vote_count || 0,
    genres: (item.genre_ids || []).map((id) => genreName(type, id)),
    runtime: item.runtime ?? null,
    seasons: item.number_of_seasons ?? null,
    demo: false,
  };
}

/* ------------------------------------------------------------- endpoints */

/** Lightweight card metadata used to enrich library / progress entries. */
export async function getSummary(type: MediaType, id: number): Promise<Title> {
  const data = await request<RawDetail>(`/${type}/${id}`, {}, TTL.detail);
  return { ...normalise(data, type), genres: (data.genres || []).map((g) => g.name) };
}

export async function getTitle(type: MediaType, id: number | string): Promise<Title> {
  const data = await request<RawDetail>(`/${type}/${id}`, { append_to_response: "credits,videos,recommendations,external_ids" }, TTL.detail);
  const base = normalise(data, type);
  const trailer = (data.videos?.results || []).find((v) => v.site === "YouTube" && /trailer|teaser/i.test(v.type));
  const cast = (data.credits?.cast || []).slice(0, 12).map((p) => ({
    name: p.name,
    role: p.character,
    photo: img(p.profile_path, "w185"),
  }));
  return {
    ...base,
    genres: (data.genres || []).map((g) => g.name),
    runtime: data.runtime ?? data.episode_run_time?.[0] ?? null,
    seasons: data.number_of_seasons ?? null,
    status: data.status || "",
    tagline: data.tagline || "",
    cast,
    trailerKey: trailer?.key || null,
    externalIds: { imdb: data.external_ids?.imdb_id || data.imdb_id || null },
    recommendations: (data.recommendations?.results || []).slice(0, 12).map((r) => normalise(r, type)),
    ...(type === "tv" ? { seasonList: (data.seasons || []).map(normaliseSeason) } : {}),
  };
}

function normaliseSeason(s: RawSeason) {
  return {
    season: s.season_number,
    name: s.name,
    episodes: s.episode_count,
    year: s.air_date ? Number(s.air_date.slice(0, 4)) : null,
    poster: img(s.poster_path, "w342"),
    overview: s.overview || "",
  };
}

export async function getSeason(id: number | string, season: number): Promise<SeasonResponse> {
  const data = await request<{
    season_number: number;
    episodes?: {
      episode_number: number;
      name?: string;
      overview?: string;
      runtime?: number | null;
      vote_average?: number;
      still_path?: string | null;
      air_date?: string;
    }[];
  }>(`/tv/${id}/season/${season}`, {}, TTL.season);
  return {
    season: data.season_number,
    episodes: (data.episodes || []).map((e) => ({
      episode: e.episode_number,
      name: e.name || t("meta.episode", { number: e.episode_number }),
      overview: e.overview || "",
      runtime: e.runtime ?? null,
      rating: e.vote_average ? Math.round(e.vote_average * 10) / 10 : null,
      still: img(e.still_path, "w300"),
      airDate: e.air_date || "",
    })),
  };
}

function sortMap(sort: string): string {
  return (
    {
      popularity: "popularity.desc",
      rating: "vote_average.desc",
      newest: "primary_release_date.desc",
      oldest: "primary_release_date.asc",
      revenue: "revenue.desc",
      title: "original_title.asc",
    }[sort] || "popularity.desc"
  );
}

export async function discover(
  type: MediaType,
  {
    page = 1,
    genre = "",
    sort = "popularity",
    year = "",
    rating = "",
    language = "",
    runtimeGte = 0,
    runtimeLte = 0,
  }: {
    page?: number;
    genre?: string;
    sort?: string;
    year?: string;
    rating?: string;
    language?: string;
    runtimeGte?: number;
    runtimeLte?: number;
  } = {},
): Promise<Page<Title>> {
  const params: Params = {
    page,
    sort_by: sortMap(sort),
    with_genres: genre || undefined,
    "vote_average.gte": rating || undefined,
    "vote_count.gte": rating ? 60 : undefined,
    with_original_language: language || undefined,
    // Minutes: film runtime, or episode runtime for series.
    "with_runtime.gte": runtimeGte || undefined,
    "with_runtime.lte": runtimeLte || undefined,
    include_adult: false,
  };
  if (year) {
    if (type === "movie") {
      params.primary_release_date_gte = `${year}-01-01`;
      params.primary_release_date_lte = `${year}-12-31`;
    } else {
      params.first_air_date_gte = `${year}-01-01`;
      params.first_air_date_lte = `${year}-12-31`;
    }
  }
  const data = await request<RawList<RawItem>>(`/discover/${type}`, params, TTL.list);
  return {
    page: data.page ?? page,
    totalPages: Math.min(data.total_pages ?? 1, 500),
    results: (data.results || []).map((r) => normalise(r, type)),
  };
}

export async function search(
  query: string,
  { page = 1, type = "all", genre = "", year = "", rating = "" }: {
    page?: number;
    type?: string;
    genre?: string;
    year?: string;
    rating?: string;
  } = {},
): Promise<Page<Title>> {
  if (!query) {
    if (type === "all") return { page: 1, totalPages: 0, results: [] };
    return discover(type as MediaType, { page, genre, year, rating });
  }
  const data = await request<RawList<RawItem>>("/search/multi", { query, page, include_adult: false }, TTL.search);
  let results = (data.results || [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => normalise(r));
  if (type !== "all") results = results.filter((r) => r.type === type);
  if (genre) results = results.filter((r) => r.genres.includes(genre));
  if (year) results = results.filter((r) => r.year === Number(year));
  if (rating) results = results.filter((r) => (r.rating ?? 0) >= Number(rating));
  return { page: data.page ?? page, totalPages: Math.min(data.total_pages ?? 1, 500), results };
}

export async function getGenres(type: MediaType): Promise<{ id: string; name: string }[]> {
  const data = await request<{ genres?: { id: number; name: string }[] }>(`/genre/${type}/list`, {}, TTL.genres);
  return (data.genres || []).map((g) => ({ id: String(g.id), name: g.name }));
}

export async function getHome(): Promise<{ trending: Title[]; rows: { key: string; title: string; items: Title[]; wide?: boolean }[] }> {
  const [trending, movies, topMovies, tv, topTv, upcoming] = await Promise.all([
    request<RawList<RawItem>>("/trending/all/week", {}, TTL.list),
    request<RawList<RawItem>>("/movie/popular", {}, TTL.list),
    request<RawList<RawItem>>("/movie/top_rated", {}, TTL.list),
    request<RawList<RawItem>>("/tv/popular", {}, TTL.list),
    request<RawList<RawItem>>("/tv/top_rated", {}, TTL.list),
    request<RawList<RawItem>>("/movie/upcoming", {}, TTL.list),
  ]);
  return {
    trending: (trending.results || []).filter((r) => r.media_type !== "person").map((r) => normalise(r)),
    rows: [
      { key: "trending-movies", title: t("home.row.trendingFilms"), items: (movies.results || []).map((r) => normalise(r, "movie")) },
      { key: "top-movies", title: t("home.row.acclaimed"), items: (topMovies.results || []).map((r) => normalise(r, "movie")), wide: true },
      { key: "popular-tv", title: t("home.row.binge"), items: (tv.results || []).map((r) => normalise(r, "tv")) },
      { key: "top-tv", title: t("home.row.television"), items: (topTv.results || []).map((r) => normalise(r, "tv")), wide: true },
      { key: "upcoming", title: t("home.row.soon"), items: (upcoming.results || []).map((r) => normalise(r, "movie")) },
    ],
  };
}

export async function recommendationsFor(type: MediaType, id: number): Promise<Title[]> {
  const data = await request<RawList<RawItem>>(`/${type}/${id}/recommendations`, {}, TTL.list);
  return (data.results || []).slice(0, 16).map((r) => normalise(r, type));
}
