/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional build-time TMDB key (v3 key or v4 read token). Baked into the bundle — public. */
  readonly VITE_TMDB_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
