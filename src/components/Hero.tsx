import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Check, Info, Play, Star, X } from "lucide-react";
import type { Title } from "../lib/types";
import { api } from "../lib/api";
import { mediaLabel, runtime } from "../lib/format";
import { useT } from "../lib/i18n";
import { useToast } from "./Toast";

export function Hero({ items }: { items: Title[] }) {
  const t = useT();
  const slides = items.slice(0, 6);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 9000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  useEffect(() => {
    if (!trailer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTrailer(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [trailer]);

  if (!slides.length) return null;
  const item = slides[active];
  const key = `${item.type}-${item.id}`;
  const isSaved = saved[key] ?? false;

  const toggle = async () => {
    const next = !isSaved;
    setSaved((prev) => ({ ...prev, [key]: next }));
    try {
      await api.toggleLibrary(item.type, item.id, "watchlist", next);
      toast(t(next ? "toast.addedWatchlist" : "toast.removedWatchlist", { title: item.title }));
    } catch (err) {
      setSaved((prev) => ({ ...prev, [key]: !next }));
      toast((err as Error).message, "error");
    }
  };

  return (
    <section
      className="relative h-[78svh] min-h-[540px] max-h-[860px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={`${slide.type}-${slide.id}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== active}
        >
          <img
            src={slide.backdrop || slide.poster || ""}
            alt=""
            className={`h-full w-full object-cover object-center ${i === active ? "animate-kenburns" : ""}`}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="shell relative flex h-full flex-col justify-end pb-14 md:pb-20">
        <div key={key} className="animate-fade-up max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-gold" />
            <span className="label text-gold/90">{t(item.demo ? "hero.demoFeature" : "hero.feature")}</span>
            {item.demo && (
              <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold/80">
                {t("meta.demo")}
              </span>
            )}
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-cream sm:text-5xl md:text-6xl lg:text-[4.6rem]">
            {item.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-cream/75">
            {item.rating != null && (
              <span className="flex items-center gap-1 font-medium text-gold">
                <Star size={13} fill="currentColor" /> {item.rating.toFixed(1)}
              </span>
            )}
            {item.year && <span>{item.year}</span>}
            {item.type === "tv" ? (
              item.seasons ? (
                <span>{t(item.seasons > 1 ? "hero.seasonMany" : "hero.seasonOne", { count: item.seasons })}</span>
              ) : null
            ) : item.runtime ? (
              <span>{runtime(item.runtime)}</span>
            ) : null}
            <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cream/60">
              {mediaLabel(item.type)}
            </span>
            {item.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-cream/55">
                {g}
              </span>
            ))}
          </div>

          {item.overview && (
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-cream/70 md:text-[15px]">
              {item.overview}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link
              to={item.type === "tv" ? `/watch/tv/${item.id}?season=1&episode=1` : `/watch/movie/${item.id}`}
              className="btn btn-primary px-6"
              aria-label={`${t("hero.play")} — ${item.title}`}
            >
              <Play size={17} fill="currentColor" /> {t("hero.play")}
            </Link>
            <Link to={`/title/${item.type}/${item.id}`} className="btn btn-ghost">
              <Info size={17} /> {t("hero.more")}
              <span className="sr-only"> — {item.title}</span>
            </Link>
            <button
              onClick={toggle}
              className="btn btn-ghost px-3.5"
              aria-pressed={isSaved}
              aria-label={t(isSaved ? "title.removeWatchlist" : "title.addWatchlist")}
            >
              {isSaved ? <Check size={17} className="text-gold" /> : <Bookmark size={17} />}
            </button>
            {item.trailerKey && (
              <button onClick={() => setTrailer(item.trailerKey!)} className="btn btn-ghost px-3.5">
                <Play size={15} /> {t("hero.trailer")}
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-6 right-4 hidden items-center gap-2 md:right-8 md:flex xl:right-12">
          {slides.map((slide, i) => (
            <button
              key={`${slide.type}-${slide.id}`}
              onClick={() => setActive(i)}
              aria-label={t("hero.show", { title: slide.title })}
              aria-current={i === active}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                i === active ? "w-8 bg-gold" : "w-3 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {trailer && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} — ${t("hero.trailer")}`}
          onClick={() => setTrailer(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer}?autoplay=1&rel=0`}
                title={`${item.title} — ${t("hero.trailer")}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <button
              onClick={() => setTrailer(null)}
              className="absolute -right-2 -top-11 grid size-9 place-items-center rounded-full border border-white/15 bg-ink-900 text-cream transition hover:bg-ink-800"
              aria-label={t("common.close")}
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}