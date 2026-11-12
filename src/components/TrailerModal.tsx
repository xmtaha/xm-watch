import { useEffect } from "react";
import { X } from "lucide-react";

import { useT } from "../lib/i18n";

export function TrailerModal({ videoKey, title, onClose }: { videoKey: string; title: string; onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${t("hero.trailer")}`}
      onClick={onClose}
    >
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={`${title} — ${t("hero.trailer")}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute -right-2 -top-11 grid size-9 place-items-center rounded-full border border-white/15 bg-ink-900 text-cream transition hover:bg-ink-800"
          aria-label={t("common.close")}
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}