import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
import type { Title } from "../lib/types";
import { mediaLabel, posterFallback } from "../lib/format";
import { useT } from "../lib/i18n";

interface Props {
  item: Title;
  showMeta?: boolean;
  progress?: number;
  context?: string | null;
  href?: string;
  className?: string;
}

export function PosterCard({ item, showMeta = true, progress, context, href, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const t = useT();
  const src = item.poster || posterFallback(item.title);

  return (
    <Link
      to={href ?? `/title/${item.type}/${item.id}`}
      className={`group block w-full ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[10px] bg-ink-800 ring-1 ring-white/[0.06] transition duration-300 group-hover:ring-white/20 group-focus-visible:ring-gold">
        {!loaded && <div className="skeleton absolute inset-0" />}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = posterFallback(item.title);
            setLoaded(true);
          }}
          className={`h-full w-full object-cover transition duration-[600ms] ease-out group-hover:scale-[1.045] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-1.5">
            <span className="grid size-8 place-items-center rounded-full bg-cream text-ink-950 shadow-lg">
              <Play size={14} fill="currentColor" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/80">
              {mediaLabel(item.type)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-white">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/60">
            {item.year && <span>{item.year}</span>}
            {item.rating != null && (
              <span className="flex items-center gap-0.5 text-gold">
                <Star size={10} fill="currentColor" /> {item.rating.toFixed(1)}
              </span>
            )}
          </div>
          {context && (
            <p className="mt-1 text-[11px] font-medium text-gold/90">{context}</p>
          )}
        </div>

        {item.demo && (
          <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/60 backdrop-blur">
            {t("meta.demo")}
          </span>
        )}

        {progress != null && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
            <div className="h-full bg-gold" style={{ width: `${Math.min(100, Math.max(2, progress))}%` }} />
          </div>
        )}
      </div>

      {showMeta && (
        <div className="mt-2 px-0.5">
          <p className="line-clamp-1 text-[13px] font-medium text-cream/90 transition-colors group-hover:text-cream">
            {item.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
            {item.year ?? "—"}
            {item.rating != null && (
              <>
                <span className="size-0.5 rounded-full bg-muted/50" />
                <span className="text-gold/80">{item.rating.toFixed(1)}</span>
              </>
            )}
          </p>
        </div>
      )}
    </Link>
  );
}