/**
 * Provider registry. Previously read from ./config/providers.json by the
 * server; a static build cannot read files at runtime, so the defaults ship
 * inside the bundle and the user's edits are stored in localStorage.
 */
import { ApiError } from "./errors";
import { t, type MessageKey } from "./i18n";
import type { MediaType, Provider, ProviderConfig } from "./types";

// v3: EmbedMaster + VidCore presets added and put in front of the list; v2
// saved lists do not know them, so they are ignored and the new defaults apply.
const STORAGE_KEY = "cineflow:providers:v3";

/**
 * Presets, in display order. These services publish no stable, licensed embed
 * API, so the templates below are the documented public routes: verify them for
 * your region and only enable what you may use.
 *
 * - EmbedMaster: docs at https://embedmaster.com/documentation/ — embed host
 *   is embedmaster.link, {id} is a TMDB id or an IMDb id with the "tt" prefix.
 *   The docs ask you not to add a sandbox attribute to its iframe.
 * - VidCore: vidcore.io — {id} is an IMDb ("tt…") or TMDB id.
 * - VidFast: vidfast.vc.
 */
const PRESETS: ProviderConfig[] = [
  {
    id: "embedmaster",
    name: "EmbedMaster",
    kind: "iframe",
    enabled: true,
    priority: 0,
    idType: "tmdb",
    movie: "https://embedmaster.link/movie/{id}",
    tv: "https://embedmaster.link/tv/{id}/{season}/{episode}",
    note: "provider.note.embedmaster",
  },
  {
    id: "vidcore",
    name: "VidCore",
    kind: "iframe",
    enabled: true,
    priority: 10,
    idType: "tmdb",
    movie: "https://vidcore.io/movie/{id}",
    tv: "https://vidcore.io/tv/{id}/{season}/{episode}",
    note: "provider.note.vidcore",
  },
  {
    id: "vidfast",
    name: "VidFast",
    kind: "iframe",
    enabled: true,
    priority: 20,
    idType: "tmdb",
    movie: "https://vidfast.vc/movie/{id}",
    tv: "https://vidfast.vc/tv/{id}/{season}/{episode}",
    note: "provider.note.vidfast",
  },
  {
    id: "vidapi",
    name: "VidAPI",
    kind: "iframe",
    enabled: true,
    priority: 30,
    idType: "tmdb",
    movie: "https://vidapi.xyz/embed/movie/{id}",
    tv: "https://vidapi.xyz/embed/tv/{id}/{season}/{episode}",
    note: "provider.note.thirdParty",
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    kind: "iframe",
    enabled: true,
    priority: 40,
    idType: "tmdb",
    movie: "https://vidsrc.to/embed/movie/{id}",
    tv: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
    note: "provider.note.thirdParty",
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    kind: "iframe",
    enabled: true,
    priority: 50,
    idType: "tmdb",
    movie: "https://autoembed.co/movie/tmdb/{id}",
    tv: "https://autoembed.co/tv/tmdb/{id}-{season}-{episode}",
    note: "provider.note.thirdParty",
  },
  {
    id: "other",
    name: "Other provider",
    kind: "iframe",
    enabled: false,
    priority: 60,
    idType: "tmdb",
    movie: "",
    tv: "",
    note: "provider.note.preset",
  },
];

const DEFAULT_CONFIG: ProviderConfig[] = [...PRESETS];

const PLACEHOLDER = /\{(id|tmdbId|imdbId|type|season|episode|year)\}/g;

let cached: ProviderConfig[] | null = null;

const cleanId = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);

export function validateProvider(p: Partial<ProviderConfig>): ProviderConfig {
  const out: ProviderConfig = {
    id: cleanId(p.id),
    name: String(p.name || "").trim().slice(0, 60),
    kind: p.kind === "hls" || p.kind === "file" ? p.kind : "iframe",
    enabled: Boolean(p.enabled),
    priority: Number.isFinite(Number(p.priority)) ? Number(p.priority) : 50,
    idType: p.idType === "imdb" ? "imdb" : "tmdb",
    movie: String(p.movie || "").trim(),
    tv: String(p.tv || "").trim(),
    note: String(p.note || "").slice(0, 300),
    ...(p.demoOnly ? { demoOnly: true } : {}),
  };
  if (!out.id || !out.name) throw new ApiError(t("error.providerName"), 400);
  for (const url of [out.movie, out.tv]) {
    if (url && !/^https?:\/\//i.test(url)) throw new ApiError(t("error.providerUrl", { url }), 400);
  }
  return out;
}

/** Preset notes are stored as i18n keys so they follow the active language. */
export function providerNote(note: string): string {
  return note.startsWith("provider.note.") ? t(note as MessageKey) : note;
}

export function getProvidersConfig(): { providers: ProviderConfig[] } {
  if (cached) return { providers: cached };
  let stored: ProviderConfig[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { providers?: unknown };
      if (Array.isArray(parsed.providers)) stored = parsed.providers as ProviderConfig[];
    }
  } catch {
    stored = null;
  }
  cached = stored && stored.length ? stored : [...DEFAULT_CONFIG];
  return { providers: cached };
}

export function saveProvidersConfig(list: unknown): { providers: ProviderConfig[] } {
  const providers = (Array.isArray(list) ? list : []).map((p) => validateProvider(p as Partial<ProviderConfig>));
  const ids = new Set<string>();
  for (const p of providers) {
    if (ids.has(p.id)) throw new ApiError(t("error.providerDuplicate", { id: p.id }), 400);
    ids.add(p.id);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ providers }));
  } catch {
    throw new ApiError(t("error.providerStorage"), 500);
  }
  cached = providers;
  return { providers };
}

export function resetProvidersConfig(): { providers: ProviderConfig[] } {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  cached = null;
  return getProvidersConfig();
}

export function publicProviderConfig(): { path: string; providers: ProviderConfig[] } {
  return { path: "this browser (localStorage)", providers: getProvidersConfig().providers };
}

export interface ProviderContext {
  id: number;
  type: MediaType;
  season: number;
  episode: number;
  imdbId?: string | null;
}

function fill(template: string, ctx: Record<string, unknown>): string {
  return template.replace(PLACEHOLDER, (_, key: string) => {
    const value = ctx[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

/**
 * Builds the ordered list of playable sources for one title. Providers that
 * cannot be resolved (missing IMDb id, no template) are dropped, not faked.
 */
export function resolveProviders(ctx: ProviderContext, { demo = false }: { demo?: boolean } = {}): Provider[] {
  const { providers } = getProvidersConfig();
  const seen = new Set<string>();
  return providers
    .filter((p) => p.enabled)
    .filter((p) => !p.demoOnly || demo)
    .filter((p) => {
      const template = ctx.type === "tv" ? p.tv : p.movie;
      if (!template) return false;
      if (p.idType === "imdb" && !ctx.imdbId) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority)
    .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
    .map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      note: p.note || "",
      url: fill(ctx.type === "tv" ? p.tv : p.movie, { ...ctx, tmdbId: ctx.id }),
    }));
}

export interface ProviderCheck {
  status: "ok" | "down" | "blocked" | "unknown";
  detail: string;
  checkedAt: number;
}

/**
 * Reachability probe from the browser. Cross-origin responses are opaque to
 * JavaScript, so this can only report whether the request left the machine —
 * never pretend a page "works".
 */
export async function checkProvider(url: string): Promise<ProviderCheck> {
  if (!/^https?:\/\//i.test(url)) throw new ApiError(t("error.providerUrlBare"), 400);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", redirect: "follow", signal: controller.signal });
    return {
      status: "unknown",
      detail: t("error.probeReachable"),
      checkedAt: Date.now(),
    };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      status: "down",
      detail: t(aborted ? "error.probeTimeout" : "error.probeUnreachable"),
      checkedAt: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function defaultProviderTemplate(): ProviderConfig {
  return {
    id: "",
    name: "",
    kind: "iframe",
    enabled: false,
    priority: 20,
    idType: "tmdb",
    movie: "",
    tv: "",
    note: "",
  };
}
