export type MediaType = "movie" | "tv";

export interface Title {
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  rating: number | null;
  votes: number;
  genres: string[];
  runtime: number | null;
  seasons: number | null;
  demo: boolean;
  status?: string;
  tagline?: string;
  cast?: { name: string; role: string; photo?: string | null }[];
  trailerKey?: string | null;
  externalIds?: { imdb: string | null };
  recommendations?: Title[];
  seasonList?: Season[];
  inWatchlist?: boolean;
  isFavorite?: boolean;
  /** Present on continue-watching entries. */
  progress?: Progress;
  context?: string | null;
  percent?: number;
}

export interface Season {
  season: number;
  name: string;
  episodes: number;
  year: number | null;
  poster: string | null;
  overview: string;
}

export interface Episode {
  episode: number;
  name: string;
  overview: string;
  runtime: number | null;
  rating: number | null;
  still: string | null;
  airDate: string;
}

export interface SeasonResponse {
  season: number;
  episodes: Episode[];
}

export interface Progress {
  media_type: MediaType;
  media_id: number;
  season: number;
  episode: number;
  position: number;
  duration: number;
  watched: number;
  updated_at: number;
}

export interface Row {
  key: string;
  title: string;
  items: Title[];
  wide?: boolean;
  continueRow?: boolean;
}

export interface HomeResponse {
  demo: boolean;
  trending: Title[];
  rows: Row[];
}

export interface Page<T> {
  page: number;
  totalPages: number;
  results: T[];
  demo?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  kind: "iframe" | "hls" | "file";
  note: string;
  url: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  kind: "iframe" | "hls" | "file";
  enabled: boolean;
  priority: number;
  idType: "tmdb" | "imdb";
  movie: string;
  tv: string;
  note: string;
  demoOnly?: boolean;
}

export interface Status {
  demo: boolean;
  hasKey: boolean;
  providers: number;
}