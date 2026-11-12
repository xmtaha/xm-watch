import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "./api";
import { t, useLang } from "./i18n";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Minimal fetch-on-path hook: path is the cache key. Pass null to skip.
 * The interface language is part of the dependency list, so switching to
 * Turkish refetches every screen (TMDB is queried with tr-TR).
 */
export function useApi<T>(path: string | null): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: Boolean(path) });
  const [nonce, setNonce] = useState(0);
  const lang = useLang();

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    api
      .get<T>(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err: Error) => alive && setState({ data: null, error: err.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [path, nonce, lang]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useDocumentTitle(title: string | null | undefined) {
  const lang = useLang();
  useEffect(() => {
    document.title = title ? `${title} — CineFlow` : `CineFlow — ${t("app.tagline")}`;
  }, [title, lang]);
}

/** Saves scroll position on unmount and restores it when returning to a list. */
export function useScrollRestore(key: string) {
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = sessionStorage.getItem(`scroll:${key}`);
    if (saved) window.scrollTo({ top: Number(saved), behavior: "instant" as ScrollBehavior });
    return () => sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
  }, [key]);
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
