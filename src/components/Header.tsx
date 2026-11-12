import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bookmark, Search, Settings2 } from "lucide-react";

import { useT, type MessageKey } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

const LINKS: { to: string; key: MessageKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/films", key: "nav.films" },
  { to: "/series", key: "nav.series" },
  { to: "/library", key: "nav.library" },
  { to: "/pick", key: "nav.pick" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-white/[0.06]" : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center gap-6 md:h-20">
        <Link to="/" className="group flex shrink-0 items-baseline gap-0.5" aria-label="CineFlow">
          <span className="font-display text-[1.7rem] leading-none tracking-tight text-cream md:text-[2rem]">
            Cineflow
          </span>
          <span className="mb-0.5 block size-1.5 rounded-full bg-gold transition-transform duration-300 group-hover:scale-125" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t("nav.menu")}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `relative rounded-full px-3.5 py-2 text-sm transition-colors ${
                  isActive ? "text-cream" : "text-muted hover:text-cream"
                }`
              }
              aria-current={pathname === link.to ? "page" : undefined}
            >
              {({ isActive }) => (
                <>
                  {t(link.key)}
                  <span
                    className={`absolute inset-x-3.5 -bottom-0.5 h-px bg-gold transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/search"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-cream"
            aria-label={t("search.title")}
          >
            <Search size={18} strokeWidth={1.7} />
            <span className="hidden lg:inline">{t("nav.search")}</span>
          </Link>
          <Link
            to="/library"
            className="hidden rounded-full p-2.5 text-muted transition-colors hover:bg-white/5 hover:text-cream sm:block"
            aria-label={t("nav.library")}
          >
            <Bookmark size={18} strokeWidth={1.7} />
          </Link>
          <LanguageSwitcher className="ml-1 flex" />
          <Link
            to="/settings"
            className="group ml-1 flex items-center gap-2 rounded-full p-1 pr-1 sm:pr-3"
            aria-label={t("nav.settings")}
          >
            <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-ink-700 to-ink-850 font-display text-base text-gold transition-colors group-hover:border-gold/40">
              C
            </span>
            <Settings2
              size={16}
              strokeWidth={1.7}
              className="hidden text-muted transition-colors group-hover:text-cream sm:block"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
