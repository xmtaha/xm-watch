import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useApi } from "../lib/hooks";
import { useT } from "../lib/i18n";
import type { HomeResponse } from "../lib/types";
import { Hero } from "../components/Hero";
import { Row, RowSkeleton } from "../components/Row";
import { ErrorState } from "../components/States";

export default function Home() {
  const { data, loading, error, reload } = useApi<HomeResponse>("/home");
  const t = useT();
  const rows = data?.rows ?? [];

  return (
    <>
      {loading && !data ? (
        <>
          <div className="relative h-[70svh] min-h-[480px] max-h-[820px] overflow-hidden">
            <div className="skeleton absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
            <div className="shell absolute inset-x-0 bottom-16">
              <div className="h-3 w-32 rounded bg-white/10" />
              <div className="mt-5 h-12 w-2/3 rounded bg-white/10 md:h-16 md:w-1/2" />
              <div className="mt-4 h-4 w-40 rounded bg-white/5" />
              <div className="mt-5 h-11 w-48 rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="shell">
            <RowSkeleton title={t("home.row.trendingFilms")} />
            <RowSkeleton title={t("home.row.binge")} />
          </div>
        </>
      ) : error && !data ? (
        <div className="shell pt-28 md:pt-36">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <>
          {data && <Hero items={data.trending} />}
          <div className="shell relative z-10 -mt-2">
            {data?.demo && (
              <div className="mb-8 flex flex-col gap-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 py-3.5 text-[13px] text-cream/70 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2.5">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-cream">{t("home.demoTitle")}.</span> {t("home.demoBody")}
                  </span>
                </p>
                <Link to="/settings" className="btn btn-ghost shrink-0 px-3 py-2 text-[13px]">
                  {t("home.demoCta")}
                </Link>
              </div>
            )}

            {rows.map((row) => (
              <Row key={row.key} row={row} />
            ))}
          </div>
        </>
      )}
    </>
  );
}