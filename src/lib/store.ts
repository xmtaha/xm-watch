/**
 * Personal state (watchlist, favourites, playback progress) kept in
 * localStorage. This replaces the SQLite tables the old server owned: a static
 * site has no shared database, so each browser keeps its own library.
 */
import { demoTitle } from "./demo";
import { ApiError } from "./errors";
import { timecode } from "./format";
import { t } from "./i18n";
import { getSummary, isDemo } from "./tmdb";
import type { MediaType, Progress, Row, Title } from "./types";

const LIBRARY_KEY = "cineflow:library:v1";
const PROGRESS_KEY = "cineflow:progress:v1";
const PROGRESS_LIMIT = 300;

export type LibraryList = "watchlist" | "favorite";

export interface LibraryRow {
  media_type: MediaType;
  media_id: number;
  list: LibraryList;
  added_at: number;
}

export interface ProgressInput {
  type: MediaType;
  id: number;
  season?: number;
  episode?: number;
  position?: number;
  duration?: number;
  watched?: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new ApiError(t("error.storage"), 500);
  }
}

const isList = (value: unknown): value is LibraryList => value === "watchlist" || value === "favorite";
const isType = (value: unknown): value is MediaType => value === "movie" || value === "tv";

/* ---------------------------------------------------------------- library */

export function libraryRows(): LibraryRow[] {
  return readJson<LibraryRow[]>(LIBRARY_KEY, [])
    .filter((row) => isType(row?.media_type) && typeof row.media_id === "number" && isList(row?.list))
    .sort((a, b) => b.added_at - a.added_at);
}

export function hasLibrary(type: MediaType, id: number, list: LibraryList): boolean {
  return libraryRows().some((row) => row.media_type === type && row.media_id === id && row.list === list);
}

/** Adds or removes one entry. Returns whether the title is now in the list. */
export function setLibrary(type: MediaType, id: number, list: LibraryList, add: boolean): boolean {
  const rows = libraryRows();
  const index = rows.findIndex((row) => row.media_type === type && row.media_id === id && row.list === list);
  if (add) {
    if (index < 0) rows.unshift({ media_type: type, media_id: id, list, added_at: Date.now() });
    writeJson(LIBRARY_KEY, rows);
    return true;
  }
  if (index >= 0) rows.splice(index, 1);
  writeJson(LIBRARY_KEY, rows);
  return false;
}

/* --------------------------------------------------------------- progress */

export function progressRows(): Progress[] {
  return readJson<Progress[]>(PROGRESS_KEY, []).filter(
    (row) => isType(row?.media_type) && typeof row.media_id === "number" && typeof row.updated_at === "number",
  );
}

/**
 * One row per episode/season (season 0 is the film), which is what makes
 * "where did I stop" visible per episode. A row is watched or not, and only that
 * row is touched: one episode never implies the rest of the series.
 */
export function saveProgressRecord(input: ProgressInput): void {
  const season = Math.max(0, Math.trunc(Number(input.season) || 0));
  const episode = Math.max(0, Math.trunc(Number(input.episode) || 0));
  const rows = progressRows();
  const index = rows.findIndex(
    (row) =>
      row.media_type === input.type && row.media_id === input.id && row.season === season && row.episode === episode,
  );
  const existing = index >= 0 ? rows[index] : undefined;
  // A position-only save (the player ticking) must not silently clear the flag.
  const watched = input.watched == null ? (existing?.watched ? 1 : 0) : input.watched ? 1 : 0;
  const duration = Math.max(0, Number(input.duration) || 0);

  const next: Progress = {
    media_type: input.type,
    media_id: input.id,
    season,
    episode,
    position: input.watched ? duration : Math.max(0, Number(input.position) || 0),
    duration: duration || existing?.duration || 0,
    watched,
    updated_at: Date.now(),
  };
  if (index >= 0) rows[index] = next;
  else rows.push(next);
  rows.sort((a, b) => b.updated_at - a.updated_at);
  writeJson(PROGRESS_KEY, rows.slice(0, PROGRESS_LIMIT));
}

export function watchedInSeason(type: MediaType, id: number, season: number): number[] {
  return progressRows()
    .filter((row) => row.media_type === type && row.media_id === id && row.season === season && row.watched === 1)
    .map((row) => row.episode);
}

/** Watched rows of one title as "season:episode" keys — the per-episode truth. */
export function watchedKeys(type: MediaType, id: number): string[] {
  return progressRows()
    .filter((row) => row.media_type === type && row.media_id === id && row.watched === 1)
    .map((row) => row.season + ":" + row.episode);
}

export interface EpisodePosition {
  position: number;
  duration: number;
  watched: boolean;
}

/** Every stored stop point of one title, keyed "season:episode". */
export function episodePositions(type: MediaType, id: number): Record<string, EpisodePosition> {
  const out: Record<string, EpisodePosition> = {};
  for (const row of progressRows()) {
    if (row.media_type !== type || row.media_id !== id) continue;
    out[row.season + ":" + row.episode] = {
      position: Math.max(0, Number(row.position) || 0),
      duration: Math.max(0, Number(row.duration) || 0),
      watched: row.watched === 1,
    };
  }
  return out;
}

/**
 * Series-level switch. Marking watched writes one row per listed episode; clearing
 * un-watches every row the title already had. One write either way.
 */
export function setTitleWatched(
  type: MediaType,
  id: number,
  watched: boolean,
  episodes: { season: number; episode: number; duration?: number }[] = [],
): void {
  const rows = progressRows();
  if (!watched) {
    for (const row of rows) {
      if (row.media_type === type && row.media_id === id) row.watched = 0;
    }
    writeJson(PROGRESS_KEY, rows);
    return;
  }
  const now = Date.now();
  for (const ep of episodes) {
    const duration = Math.max(0, Number(ep.duration) || 0);
    const index = rows.findIndex(
      (row) => row.media_type === type && row.media_id === id && row.season === ep.season && row.episode === ep.episode,
    );
    const length = duration || rows[index]?.duration || 0;
    const next: Progress = {
      media_type: type,
      media_id: id,
      season: ep.season,
      episode: ep.episode,
      position: length,
      duration: length,
      watched: 1,
      updated_at: now,
    };
    if (index >= 0) rows[index] = next;
    else rows.push(next);
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  writeJson(PROGRESS_KEY, rows.slice(0, PROGRESS_LIMIT));
}
export function clearProgressRecord(type: MediaType, id: number): void {
  writeJson(
    PROGRESS_KEY,
    progressRows().filter((row) => !(row.media_type === type && row.media_id === id)),
  );
}

/* -------------------------------------------------------------- summaries */

/** Card metadata for a stored id — from the demo catalogue or TMDB. */
async function summaryFor(type: MediaType, id: number): Promise<Title | null> {
  try {
    if (isDemo() || id < 0) return demoTitle(type, id);
    return await getSummary(type, id);
  } catch {
    return null;
  }
}

export async function summaries(rows: LibraryRow[]): Promise<Title[]> {
  const out: Title[] = [];
  for (const row of rows) {
    const title = await summaryFor(row.media_type, row.media_id);
    if (title) out.push(title);
  }
  return out;
}

export async function favouriteSummaries(limit = 8): Promise<Title[]> {
  const rows = libraryRows().filter((row) => row.list === "favorite").slice(0, limit);
  return summaries(rows);
}

/**
 * Newest unfinished entry per title, newest first. Watched rows are left out:
 * "continue watching" means there is still something to watch, and a single
 * finished episode must not make the whole series look done.
 */
export async function continueWatchingEntries(limit = 12): Promise<Title[]> {
  const latest = new Map<string, Progress>();
  for (const row of progressRows()) {
    if (row.watched) continue;
    const key = `${row.media_type}:${row.media_id}`;
    const previous = latest.get(key);
    if (!previous || row.updated_at > previous.updated_at) latest.set(key, row);
  }
  const recent = [...latest.values()].sort((a, b) => b.updated_at - a.updated_at).slice(0, limit);
  const out: Title[] = [];
  for (const row of recent) {
    const title = await summaryFor(row.media_type, row.media_id);
    if (title) out.push({ ...title, progress: row });
  }
  return out;
}

export function decorateContinue(items: Title[]): Title[] {
  return items.map((entry) => {
    const row = entry.progress;
    const where = row?.season ? `S${row.season} E${row.episode}` : "";
    // "where you stopped" on the card itself: S2 E3 · 12:34
    const stop = row && row.position > 5 && !row.watched ? timecode(row.position) : "";
    return {
      ...entry,
      context: [where, stop].filter(Boolean).join(" · ") || null,
      percent: row?.duration ? Math.min(100, (row.position / row.duration) * 100) : 0,
    };
  });
}

export function withContinue(rows: Row[], continueWatching: Title[]): Row[] {
  if (!continueWatching.length) return rows;
  return [
    { key: "continue", title: t("library.continue"), items: decorateContinue(continueWatching), continueRow: true },
    ...rows,
  ];
}
