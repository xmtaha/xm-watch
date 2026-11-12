import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useT } from "../lib/i18n";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(230,181,102,0.07),transparent)] blur-2xl" />
      <div className="absolute -bottom-60 right-0 h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(111,92,255,0.05),transparent)] blur-2xl" />
      <div className="grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
    </div>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="mt-20 border-t border-white/[0.06] pb-28 pt-10 md:pb-12">
      <div className="shell flex flex-col gap-6 text-sm text-muted md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/" className="flex items-baseline gap-0.5">
            <span className="font-display text-2xl text-cream">Cineflow</span>
            <span className="mb-0.5 size-1.5 rounded-full bg-gold" />
          </Link>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed">{t("footer.blurb")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <Link to="/settings" className="transition-colors hover:text-cream">
            {t("footer.setup")}
          </Link>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="transition-colors hover:text-cream">
            TMDB
          </a>
          <span className="text-muted">CineFlow 2.0</span>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="relative flex min-h-svh flex-col">
      <Ambient />
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}