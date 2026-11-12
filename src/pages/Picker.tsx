import { useCallback, useState, type ReactNode } from "react";
import { Dices, Loader2, RotateCcw } from "lucide-react";

import { api } from "../lib/api";
import type { MediaType, Title } from "../lib/types";
import { MediaGrid } from "../components/MediaGrid";
import { EmptyState, ErrorState, PageHeading } from "../components/States";
import { useDocumentTitle } from "../lib/hooks";
import { useT, type MessageKey } from "../lib/i18n";

type Kind = "movie" | "tv" | "any";
type TimeId = "any" | "short" | "normal" | "long";

const KINDS: { id: Kind; key: MessageKey }[] = [
  { id: "any", key: "pick.kind.any" },
  { id: "movie", key: "pick.kind.movie" },
  { id: "tv", key: "pick.kind.tv" },
];

// Moods map to TMDB genre ids. Films and series use different vocabularies,
// so each mood carries both lists.
const MOODS: { id: string; key: MessageKey; movie: string; tv: string }[] = [
  { id: "fun", key: "pick.mood.fun", movie: "35,16,12", tv: "35,16,10764" },
  { id: "tense", key: "pick.mood.tense", movie: "53,27,80", tv: "80,9648,10765" },
  { id: "cry", key: "pick.mood.cry", movie: "18,10749", tv: "18,10766" },
  { id: "laugh", key: "pick.mood.laugh", movie: "35", tv: "35" },
  { id: "think", key: "pick.mood.think", movie: "9648,878", tv: "9648,10765" },
  { id: "epic", key: "pick.mood.epic", movie: "28,12,14", tv: "10759,10765" },
];

// Runtime is minutes: film length, or episode length for series. 0 means
// "no bound on that side".
const TIMES: { id: TimeId; key: MessageKey; movie: [number, number]; tv: [number, number] }[] = [
  { id: "any", key: "pick.time.any", movie: [0, 0], tv: [0, 0] },
  { id: "short", key: "pick.time.short", movie: [0, 100], tv: [0, 32] },
  { id: "normal", key: "pick.time.normal", movie: [100, 135], tv: [32, 50] },
  { id: "long", key: "pick.time.long", movie: [135, 0], tv: [50, 0] },
];

const PAGE_WINDOW = 5;
const PICKS_PER_TYPE = 6;

function shuffle<T>(list: readonly T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors " +
        (active
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-white/10 text-cream/70 hover:border-white/25 hover:text-cream")
      }
    >
      {children}
    </button>
  );
}

function Step({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="hairline rounded-2xl bg-ink-900/60 p-4">
      <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/10 text-[10px] text-gold">
          {index}
        </span>
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      {note && <p className="mt-3 text-[11px] leading-relaxed text-muted/70">{note}</p>}
    </section>
  );
}

export default function Picker() {
  const t = useT();
  useDocumentTitle(t("pick.title"));

  const [kind, setKind] = useState<Kind>("any");
  const [mood, setMood] = useState<string>(MOODS[0].id);
  const [time, setTime] = useState<TimeId>("any");
  const [results, setResults] = useState<Title[]>([]);
  const [busy, setBusy] = useState(false);
  const [rolled, setRolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeKind = KINDS.find((k) => k.id === kind) ?? KINDS[0];
  const activeMood = MOODS.find((m) => m.id === mood) ?? MOODS[0];
  const activeTime = TIMES.find((x) => x.id === time) ?? TIMES[0];
  const summary = [t(activeKind.key), t(activeMood.key), t(activeTime.key)].join(" · ");

  const roll = useCallback(async () => {
    const moodDef = MOODS.find((m) => m.id === mood) ?? MOODS[0];
    const timeDef = TIMES.find((x) => x.id === time) ?? TIMES[0];
    const types: MediaType[] = kind === "any" ? ["movie", "tv"] : [kind];
    setBusy(true);
    setError(null);
    try {
      const buckets = await Promise.all(
        types.map(async (mediaType) => {
          const [gte, lte] = mediaType === "movie" ? timeDef.movie : timeDef.tv;
          const page = 1 + Math.floor(Math.random() * PAGE_WINDOW);
          const res = await api.discover(mediaType, {
            page,
            genre: mediaType === "movie" ? moodDef.movie : moodDef.tv,
            sort: "popularity",
            rating: "6",
            runtimeGte: gte,
            runtimeLte: lte,
          });
          return res.results.filter((item) => Boolean(item.poster));
        }),
      );
      const seen = new Set<string>();
      const picked: Title[] = [];
      for (const item of shuffle(buckets.flatMap((bucket) => shuffle(bucket).slice(0, PICKS_PER_TYPE)))) {
        const key = item.type + "-" + item.id;
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push(item);
      }
      setResults(picked);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : t("pick.error"));
    } finally {
      setBusy(false);
      setRolled(true);
    }
  }, [kind, mood, time, t]);

  const reset = () => {
    setResults([]);
    setRolled(false);
    setError(null);
  };

  return (
    <div className="shell">
      <PageHeading eyebrow={t("pick.eyebrow")} title={t("pick.title")} description={t("pick.subtitle")} />

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Step index="1" title={t("pick.kindTitle")}>
          {KINDS.map((k) => (
            <Chip key={k.id} active={k.id === kind} onClick={() => setKind(k.id)}>
              {t(k.key)}
            </Chip>
          ))}
        </Step>
        <Step index="2" title={t("pick.moodTitle")}>
          {MOODS.map((m) => (
            <Chip key={m.id} active={m.id === mood} onClick={() => setMood(m.id)}>
              {t(m.key)}
            </Chip>
          ))}
        </Step>
        <Step index="3" title={t("pick.timeTitle")} note={t("pick.timeNote")}>
          {TIMES.map((x) => (
            <Chip key={x.id} active={x.id === time} onClick={() => setTime(x.id)}>
              {t(x.key)}
            </Chip>
          ))}
        </Step>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={roll} disabled={busy} className="btn btn-primary px-6">
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Dices size={17} />}
          {busy ? t("pick.loading") : rolled ? t("pick.again") : t("pick.generate")}
        </button>
        {rolled && !busy && (
          <button type="button" onClick={reset} className="btn btn-ghost">
            <RotateCcw size={15} /> {t("pick.reset")}
          </button>
        )}
      </div>

      <div className="mt-12">
        {error ? (
          <ErrorState message={error} onRetry={roll} />
        ) : busy ? (
          <MediaGrid items={[]} loading count={8} />
        ) : results.length > 0 ? (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="label">{t("pick.resultTitle")}</h2>
              <p className="text-xs text-muted">{t("pick.resultsMeta", { count: results.length, summary })}</p>
            </div>
            <MediaGrid items={results} />
          </>
        ) : rolled ? (
          <EmptyState
            icon={<Dices size={20} />}
            title={t("pick.empty")}
            description={t("pick.subtitle")}
            action={
              <button type="button" onClick={roll} className="btn btn-ghost">
                <RotateCcw size={15} /> {t("pick.again")}
              </button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
