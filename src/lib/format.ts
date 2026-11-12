import { artUrl } from "./art";
import { getLang, translate, type Lang } from "./i18n";

/** "2h 15m" / "2 sa 15 dk" — hours and minutes in the interface language. */
export function runtime(minutes: number | null | undefined, lang: Lang = getLang()): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hourUnit = translate(lang, "unit.hourShort");
  const minuteUnit = translate(lang, "unit.minuteShort");
  const sep = lang === "tr" ? " " : "";
  if (!h) return `${m}${sep}${minuteUnit}`;
  return m ? `${h}${sep}${hourUnit} ${m}${sep}${minuteUnit}` : `${h}${sep}${hourUnit}`;
}

export function timecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function compactNumber(value: number, lang: Lang = getLang()): string {
  if (value >= 1000) {
    const digits = (value / 1000).toFixed(value >= 10_000 ? 0 : 1);
    return lang === "tr" ? `${digits.replace(".", ",")} bin` : `${digits}k`;
  }
  return String(value);
}

export function mediaLabel(type: "movie" | "tv", lang: Lang = getLang()): string {
  return translate(lang, type === "tv" ? "meta.tv" : "meta.movie");
}

export function episodeCode(season?: number | null, episode?: number | null): string {
  if (!season || !episode) return "";
  return `S${season} · E${episode}`;
}

export function posterFallback(title: string): string {
  return artUrl({ title, kind: "poster", seed: "fallback" });
}
