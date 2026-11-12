import { LANGS, setLang, useLang, useT } from "../lib/i18n";

/** Compact EN / TR toggle. Every subscribed component re-renders on change. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={`flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5 ${className}`}
    >
      {LANGS.map((entry) => {
        const active = lang === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => setLang(entry.id)}
            aria-pressed={active}
            aria-label={t("nav.switchTo", { language: entry.label })}
            title={entry.label}
            className={`rounded-full px-2 py-1 text-[11px] font-medium tracking-wide transition-colors ${
              active ? "bg-gold/15 text-gold" : "text-muted hover:text-cream"
            }`}
          >
            {entry.short}
          </button>
        );
      })}
    </div>
  );
}
