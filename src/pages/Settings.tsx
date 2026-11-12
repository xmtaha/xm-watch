import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  Undo2,
  Unplug,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/hooks";
import type { ProviderConfig, Status } from "../lib/types";
import { useToast } from "../components/Toast";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useT } from "../lib/i18n";
import { providerNote } from "../lib/providers";

const PLACEHOLDERS = "{id} {tmdbId} {imdbId} {type} {season} {episode} {year}";

export default function Settings() {
  const status = useApi<Status>("/status");
  const config = useApi<{ path: string; providers: ProviderConfig[] }>("/settings/providers");
  const toast = useToast();
  const t = useT();

  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ProviderConfig[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingProviders, setSavingProviders] = useState(false);

  useEffect(() => {
    if (config.data) setDraft(config.data.providers);
  }, [config.data]);

  const dirty = Boolean(draft && JSON.stringify(draft) !== JSON.stringify(config.data?.providers));

  const saveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setSavingKey(true);
    try {
      await api.saveTmdbKey(key.trim());
      setKey("");
      status.reload();
      toast(t("settings.tmdbSaved"));
    } catch (err) {
      setKeyError((err as Error).message);
    } finally {
      setSavingKey(false);
    }
  };

  const removeKey = async () => {
    if (!window.confirm(t("settings.tmdbDisconnectConfirm"))) return;
    try {
      const res = await api.clearTmdbKey();
      status.reload();
      toast(t(res.demo ? "settings.tmdbDisconnectedDemo" : "settings.tmdbDisconnectedEnv"), "info");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const update = (id: string, patch: Partial<ProviderConfig>) => {
    setDraft((prev) => prev?.map((p) => (p.id === id ? { ...p, ...patch } : p)) ?? prev);
  };

  const addProvider = () => {
    const n = (draft?.length ?? 0) + 1;
    const provider: ProviderConfig = {
      id: `provider-${Date.now().toString(36)}`,
      name: t("settings.providerNew"),
      kind: "iframe",
      enabled: false,
      priority: 50 + n,
      idType: "tmdb",
      movie: "",
      tv: "",
      note: "",
    };
    setDraft((prev) => [...(prev ?? []), provider]);
    setExpanded(provider.id);
  };

  const resetProviders = async () => {
    if (!window.confirm(t("settings.providerResetConfirm"))) return;
    const res = await api.resetProvidersConfig();
    setDraft(res.providers);
    config.reload();
    toast(t("settings.providerResetDone"), "info");
  };

  const saveProviders = async () => {
    if (!draft) return;
    setSavingProviders(true);
    try {
      const res = await api.saveProvidersConfig(draft);
      setDraft(res.providers);
      config.reload();
      toast(t("settings.providerSaved"));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingProviders(false);
    }
  };

  const testUrl = async (url: string) => {
    if (!url) return toast(t("settings.providerAddUrlFirst"), "error");
    const res = await api.checkProvider(url).catch((err: Error) => ({ status: "unknown" as const, detail: err.message }));
    toast(`${res.status.toUpperCase()} — ${res.detail}`, res.status === "ok" ? "success" : "info");
  };

  return (
    <div className="shell max-w-5xl">
      <div className="pt-28 md:pt-36">
        <p className="label mb-3 text-gold/80">{t("settings.eyebrow")}</p>
        <h1 className="font-display text-4xl text-cream md:text-5xl">{t("settings.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{t("settings.subtitle")}</p>
      </div>

      {/* Language */}
      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-ink-900/60 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-cream">{t("settings.languageTitle")}</h2>
          <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted">{t("settings.languageBody")}</p>
        </div>
        <LanguageSwitcher />
      </section>

      {/* TMDB */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-ink-800 text-gold">
              <KeyRound size={16} />
            </span>
            <div>
              <h2 className="text-sm font-medium text-cream">{t("settings.tmdbTitle")}</h2>
              <p className="text-[11px] text-muted">{t("settings.tmdbBody")}</p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
              status.data?.hasKey
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-gold/30 bg-gold/10 text-gold"
            }`}
          >
            <span className={`size-1.5 rounded-full ${status.data?.hasKey ? "bg-emerald-400" : "bg-gold"}`} />
            {t(status.data?.hasKey ? "settings.tmdbConnected" : "settings.tmdbDemo")}
          </span>
        </div>

        <div className="p-5">
          {status.data?.hasKey ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">{t("settings.tmdbConfigured")}</p>
              <button onClick={removeKey} className="btn btn-ghost shrink-0 text-ember">
                <Unplug size={15} /> {t("settings.tmdbDisconnect")}
              </button>
            </div>
          ) : (
            <form onSubmit={saveKey} className="space-y-3">
              <label htmlFor="tmdb-key" className="label block">
                {t("settings.tmdbKeyLabel")}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    id="tmdb-key"
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={t("settings.tmdbKeyPlaceholder")}
                    className="field pr-11 font-mono text-[13px]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-cream"
                    aria-label={t(showKey ? "settings.tmdbHide" : "settings.tmdbShow")}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button type="submit" disabled={savingKey || key.trim().length < 8} className="btn btn-gold shrink-0">
                  {savingKey ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {t(savingKey ? "settings.tmdbVerifying" : "settings.tmdbConnect")}
                </button>
              </div>
              {keyError && <p className="text-xs text-ember">{keyError}</p>}
              <p className="text-[11px] leading-relaxed text-muted">
                {t("settings.tmdbHelpBefore")}{" "}
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
                >
                  {t("settings.tmdbHelpLink")} <ExternalLink size={10} className="inline" />
                </a>
                {t("settings.tmdbHelpAfter")} <code className="text-cream/70">VITE_TMDB_API_KEY</code>{" "}
                {t("settings.tmdbHelpEnd")}
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-cream">{t("settings.providersTitle")}</h2>
            <p className="mt-0.5 text-[11px] text-muted">{t("settings.providersBody")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetProviders} className="btn btn-ghost px-3 py-2 text-xs">
              <Undo2 size={13} /> {t("settings.providerReset")}
            </button>
            <button onClick={addProvider} className="btn btn-ghost px-3 py-2 text-xs">
              <Plus size={14} /> {t("settings.addProvider")}
            </button>
          </div>
        </div>

        <div className="space-y-2.5 p-4 md:p-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-ember/20 bg-ember/[0.05] px-3.5 py-3 text-[11px] leading-relaxed text-cream/65">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-ember/80" />
            <p>{t("settings.providersWarning")}</p>
          </div>

          {config.loading && !draft && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}
          {config.error && !draft && <p className="py-4 text-sm text-ember">{config.error}</p>}

          {draft?.map((p) => {
            const open = expanded === p.id;
            return (
              <div key={p.id} className={`rounded-xl border transition ${open ? "border-white/15 bg-ink-850" : "border-white/[0.06] bg-ink-900/60"}`}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <button
                    role="switch"
                    aria-checked={p.enabled}
                    onClick={() => update(p.id, { enabled: !p.enabled })}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${p.enabled ? "bg-gold" : "bg-white/15"}`}
                    aria-label={t(p.enabled ? "settings.providerDisable" : "settings.providerEnable", { name: p.name })}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full transition-all ${p.enabled ? "left-[18px] bg-ink-950" : "left-0.5 bg-white/80"}`}
                    />
                  </button>

                  <button onClick={() => setExpanded(open ? null : p.id)} className="min-w-0 flex-1 text-left">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-cream">
                      <span className="truncate">{p.name || t("settings.providerUntitled")}</span>
                      {p.demoOnly && (
                        <span className="rounded border border-gold/25 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold/60">
                          {t("settings.providerDemoOnly")}
                        </span>
                      )}
                      {!p.enabled && (
                        <span className="text-[10px] uppercase tracking-wider text-muted">{t("settings.providerOff")}</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                      {t("settings.providerMeta", { kind: p.kind, type: p.idType, priority: p.priority })}
                      {p.movie ? ` · ${p.movie.slice(0, 52)}` : ` · ${t("settings.providerNoUrl")}`}
                    </p>
                  </button>

                  <button
                    onClick={() => setExpanded(open ? null : p.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-cream"
                    aria-label={t(open ? "settings.providerCollapse" : "settings.providerEdit")}
                    aria-expanded={open}
                  >
                    <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-white/[0.06] p-3.5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerName")}</span>
                        <input className="field" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerId")}</span>
                        <input
                          className="field font-mono text-xs"
                          value={p.id}
                          onChange={(e) => update(p.id, { id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerKind")}</span>
                        <select className="field" value={p.kind} onChange={(e) => update(p.id, { kind: e.target.value as ProviderConfig["kind"] })}>
                          <option value="iframe">iframe</option>
                          <option value="hls">HLS</option>
                          <option value="file">file</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerIdType")}</span>
                        <select className="field" value={p.idType} onChange={(e) => update(p.id, { idType: e.target.value as ProviderConfig["idType"] })}>
                          <option value="tmdb">TMDB</option>
                          <option value="imdb">IMDb</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerPriority")}</span>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          className="field"
                          value={p.priority}
                          onChange={(e) => update(p.id, { priority: Number(e.target.value) })}
                        />
                      </label>
                      <label className="block">
                        <span className="label mb-1.5 block">{t("settings.providerEnabled")}</span>
                        <button
                          onClick={() => update(p.id, { enabled: !p.enabled })}
                          className={`field flex items-center justify-between ${p.enabled ? "text-gold" : "text-muted"}`}
                        >
                          {t(p.enabled ? "settings.on" : "settings.off")}
                          <span className={`size-2 rounded-full ${p.enabled ? "bg-gold" : "bg-white/20"}`} />
                        </button>
                      </label>
                    </div>

                    <label className="block">
                      <span className="label mb-1.5 block">{t("settings.providerMovieUrl")}</span>
                      <input
                        className="field font-mono text-[11px]"
                        value={p.movie}
                        onChange={(e) => update(p.id, { movie: e.target.value })}
                        placeholder={`https://example.com/embed/movie/${PLACEHOLDERS}`}
                      />
                    </label>
                    <label className="block">
                      <span className="label mb-1.5 block">{t("settings.providerTvUrl")}</span>
                      <input
                        className="field font-mono text-[11px]"
                        value={p.tv}
                        onChange={(e) => update(p.id, { tv: e.target.value })}
                        placeholder={`https://example.com/embed/tv/{id}/{season}/{episode}`}
                      />
                    </label>
                    <label className="block">
                      <span className="label mb-1.5 block">{t("settings.providerNote")}</span>
                      <input
                        className="field text-xs"
                        value={providerNote(p.note)}
                        onChange={(e) => update(p.id, { note: e.target.value })}
                        placeholder={t("settings.providerNotePlaceholder")}
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] text-muted">
                        {t("settings.placeholders", { list: PLACEHOLDERS }) === `Placeholders: ${PLACEHOLDERS}` ? (
                          <>Placeholders: <code className="text-cream/60">{PLACEHOLDERS}</code></>
                        ) : (
                          t("settings.placeholders", { list: PLACEHOLDERS })
                        )}
                      </span>
                      <div className="ml-auto flex gap-2">
                        <button onClick={() => testUrl(p.movie || p.tv)} className="btn btn-ghost px-3 py-1.5 text-[11px]">
                          {t("settings.providerTest")}
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(t("settings.providerRemoveConfirm", { name: p.name }))) return;
                            setDraft((prev) => prev?.filter((x) => x.id !== p.id) ?? prev);
                          }}
                          className="btn btn-ghost px-3 py-1.5 text-[11px] text-ember"
                        >
                          <Trash2 size={13} /> {t("settings.providerRemove")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {config.data?.path && (
          <div className="border-t border-white/[0.06] px-5 py-3 text-[10px] text-muted">
            {t("settings.savedIn")} <code className="text-cream/50">{config.data.path}</code>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-5">
        <h2 className="text-sm font-medium text-cream">{t("settings.howTitle")}</h2>
        <div className="mt-3 grid gap-4 text-[12px] leading-relaxed text-muted sm:grid-cols-3">
          <div>
            <p className="mb-1 font-medium text-cream/80">{t("settings.how1Title")}</p>
            <p>{t("settings.how1Body")}</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-cream/80">{t("settings.how2Title")}</p>
            <p>{t("settings.how2Body")}</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-cream/80">{t("settings.how3Title")}</p>
            <p>{t("settings.how3Body")}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-ink-900/40 px-4 py-3 text-[11px] text-muted">
        <span>{t("settings.ready")}</span>
        <Link to="/" className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold">
          {t("settings.backToCatalogue")}
        </Link>
      </div>

      {(dirty || savingProviders) && (
        <div className="sticky bottom-20 z-30 mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-ink-850/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur md:bottom-6">
          <p className="text-xs text-cream/70">{t("settings.unsaved")}</p>
          <div className="flex gap-2">
            <button onClick={() => setDraft(config.data?.providers ?? [])} className="btn btn-ghost px-3 py-2 text-xs">
              <Undo2 size={13} /> {t("settings.discard")}
            </button>
            <button onClick={saveProviders} disabled={savingProviders} className="btn btn-gold px-3 py-2 text-xs">
              {savingProviders ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {t("settings.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}