import { NavLink } from "react-router-dom";
import { Bookmark, Clapperboard, Home, Tv } from "lucide-react";

import { useT, type MessageKey } from "../lib/i18n";

const ITEMS: { to: string; key: MessageKey; icon: typeof Home; end?: boolean }[] = [
  { to: "/", key: "nav.home", icon: Home, end: true },
  { to: "/films", key: "nav.films", icon: Clapperboard },
  { to: "/series", key: "nav.series", icon: Tv },
  { to: "/library", key: "nav.library", icon: Bookmark },
];

export function MobileNav() {
  const t = useT();
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("nav.menu")}
    >
      <div className="grid grid-cols-4">
        {ITEMS.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${
                isActive ? "text-gold" : "text-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 h-px w-8 bg-gold transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                />
                <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
