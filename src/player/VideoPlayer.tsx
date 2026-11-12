import { useCallback, useEffect, useRef, useState } from "react";
import {
  Captions,
  CaptionsOff,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type Hls from "hls.js";
import { timecode } from "../lib/format";
import { useT } from "../lib/i18n";

interface Props {
  src: string;
  poster?: string | null;
  title: string;
  startAt?: number;
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
  onFatalError?: (message: string) => void;
}

export function VideoPlayer({ src, poster, title, startAt = 0, onProgress, onEnded, onFatalError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const startApplied = useRef(false);
  const controlsTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const stored = Number(localStorage.getItem("cineflow:volume"));
      // 0 would mute the player, and empty/NaN values come from corrupt storage
      return Number.isFinite(stored) && stored > 0 && stored <= 1 ? stored : 0.85;
    } catch {
      return 0.85;
    }
  });
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controls, setControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [level, setLevel] = useState(-1);
  const [menu, setMenu] = useState(false);
  const [captions, setCaptions] = useState<{ index: number; label: string; lang: string }[]>([]);
  const [caption, setCaption] = useState(-1); // -1 = off; otherwise an hls.js subtitle track id
  const [captionMenu, setCaptionMenu] = useState(false);

  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const errorRef = useRef(onFatalError);
  errorRef.current = onFatalError;
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  // The stream effect must not re-run on a language switch (that would reload
  // playback), so translated strings are read through a ref instead.
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;

  const revealControls = useCallback(() => {
    setControls(true);
    if (controlsTimer.current) window.clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => {
      if (!videoRef.current?.paused) setControls(false);
    }, 2800);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    startApplied.current = false;
    setStarted(false);
    setError(null);
    setLevels([]);
    setLevel(-1);
    setCaptions([]);
    setCaption(-1);

    const onLoaded = () => {
      setDuration(video.duration || 0);
      if (startAt > 2 && !startApplied.current) {
        video.currentTime = startAt;
        startApplied.current = true;
      }
      video.play().catch(() => {
        /* autoplay can be blocked; the play overlay stays visible */
      });
    };
    const onTime = () => {
      setCurrent(video.currentTime);
      progressRef.current?.(video.currentTime, video.duration || 0);
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onPlay = () => {
      setPlaying(true);
      setStarted(true);
      revealControls();
    };
    const onPause = () => {
      setPlaying(false);
      setControls(true);
    };
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onEnd = () => {
      setPlaying(false);
      setControls(true);
      endedRef.current?.();
    };
    const onVideoError = () => {
      if (hlsRef.current) return;
      setError(tRef.current("player.loadFailed"));
      errorRef.current?.(tRef.current("player.loadFailed"));
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("durationchange", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnd);
    video.addEventListener("error", onVideoError);
    video.volume = volume;
    video.muted = muted;

    if (src.includes(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        import("hls.js")
          .then(({ default: HlsPlayer }) => {
            if (disposed) return;
            if (!HlsPlayer.isSupported()) {
              setError(tRef.current("player.hlsUnsupported"));
              return;
            }
            const hls = new HlsPlayer({ startPosition: startAt > 2 ? startAt : -1, maxBufferLength: 30 });
            // Subtitles stay off until the viewer picks one; hls.js otherwise
            // auto-shows tracks the manifest marks as default.
            hls.subtitleDisplay = false;
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(HlsPlayer.Events.MANIFEST_PARSED, (_e, data) => {
              setLevels(data.levels.map((l, index) => ({ index, label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}k` })));
            });
            hls.on(HlsPlayer.Events.LEVEL_SWITCHED, (_e, data) => setLevel(data.level));
            // Text tracks present in the manifest (most HLS streams carry subtitles here).
            hls.on(HlsPlayer.Events.SUBTITLE_TRACKS_UPDATED, (_e, data) => {
              setCaptions(
                (data.subtitleTracks || []).map((t) => ({
                  index: t.id ?? 0,
                  label: t.name || t.lang || tRef.current("player.track", { id: t.id ?? 0 }),
                  lang: t.lang || "",
                })),
              );
            });
            hls.on(HlsPlayer.Events.ERROR, (_e, data) => {
              if (!data.fatal) return;
              if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR) {
                setError(tRef.current("player.unreachable"));
                errorRef.current?.(tRef.current("player.unreachableShort"));
              } else if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                setError(tRef.current("player.playbackFailed"));
                errorRef.current?.(tRef.current("player.playbackFailed"));
              }
            });
          })
          .catch(() => setError(tRef.current("player.hlsLoadFailed")));
      }
    } else {
      video.src = src;
    }

    return () => {
      disposed = true;
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("durationchange", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("error", onVideoError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
    // volume/muted intentionally excluded: changing them should not reload the stream
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, startAt, revealControls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    try {
      localStorage.setItem("cineflow:volume", String(volume));
    } catch {
      // storage can be unavailable (private mode, blocked cookies); playback still works
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setError(tRef.current("player.blocked")));
    } else {
      video.pause();
    }
    revealControls();
  }, [revealControls]);

  const seek = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration || 0);
    revealControls();
  };

  const jump = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    revealControls();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (!containerRef.current) return;
      if (e.code === "Space" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(-10);
      } else if (e.key.toLowerCase() === "f") {
        void toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch {
      /* fullscreen can be rejected by the browser */
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* ignore */
    }
  };

  const selectLevel = (index: number) => {
    setLevel(index);
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setMenu(false);
  };

  const selectCaption = (index: number) => {
    const video = videoRef.current;
    setCaption(index);
    if (hlsRef.current) {
      // -1 turns subtitles off; anything else selects that text track.
      hlsRef.current.subtitleTrack = index;
      hlsRef.current.subtitleDisplay = index >= 0;
    } else if (video) {
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = i === index ? "showing" : "disabled";
      }
    }
    setCaptionMenu(false);
  };

  const progress = duration ? (current / duration) * 100 : 0;
  const bufferPercent = duration ? (buffered / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black"
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-contain"
        onClick={togglePlay}
        aria-label={title}
      />

      {!started && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/70 via-black/10 to-black/30 transition hover:from-black/60"
          aria-label={`${t("player.play")} ${title}`}
        >
          <span className="grid size-16 place-items-center rounded-full bg-cream text-ink-950 shadow-2xl transition hover:scale-105 md:size-20">
            <Play size={26} fill="currentColor" className="ml-1" />
          </span>
        </button>
      )}

      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-black/60 backdrop-blur">
            <Loader2 size={24} className="animate-spin text-cream" />
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div>
            <p className="text-sm font-medium text-cream">{error}</p>
            <button
              onClick={() => {
                setError(null);
                videoRef.current?.load();
                togglePlay();
              }}
              className="btn btn-ghost mt-4"
            >
              <RotateCw size={14} /> {t("states.retry")}
            </button>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-10 transition-opacity duration-300 md:px-4 ${
          controls || !playing ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="group/seek relative mb-2 flex h-5 items-center">
          <div className="pointer-events-none h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div className="absolute h-1 rounded-full bg-white/30" style={{ width: `${bufferPercent}%` }} />
            <div className="absolute h-1 rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <span
            className="pointer-events-none absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-gold opacity-0 shadow transition group-hover/seek:opacity-100"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={current}
            onChange={(e) => jump(Number(e.target.value))}
            className="absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2 cursor-pointer opacity-0"
            aria-label={t("player.seek")}
          />
        </div>

        <div className="flex items-center gap-1.5 text-cream md:gap-2.5">
          <button onClick={togglePlay} className="grid size-9 place-items-center rounded-full transition hover:bg-white/10" aria-label={t(playing ? "player.pause" : "player.play")}>
            {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
          <button onClick={() => seek(-10)} className="hidden size-9 place-items-center rounded-full transition hover:bg-white/10 sm:grid" aria-label={t("player.back10")}>
            <RotateCcw size={17} />
          </button>
          <button onClick={() => seek(10)} className="hidden size-9 place-items-center rounded-full transition hover:bg-white/10 sm:grid" aria-label={t("player.forward10")}>
            <RotateCw size={17} />
          </button>

          <span className="ml-1 text-[11px] tabular-nums text-cream/70 md:text-xs">
            {timecode(current)} <span className="text-cream/35">/ {timecode(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            <div className="group/vol flex items-center">
              <button
                onClick={() => setMuted((m) => !m)}
                className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"
                aria-label={t(muted ? "player.unmute" : "player.mute")}
              >
                <VolumeIcon size={18} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cream"
                aria-label={t("player.volume")}
              />
            </div>

            {levels.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"
                  aria-label={t("player.quality")}
                  aria-expanded={menu}
                >
                  <Gauge size={18} />
                </button>
                {menu && (
                  <div className="absolute bottom-11 right-0 w-28 overflow-hidden rounded-lg border border-white/10 bg-ink-900/95 py-1 text-xs shadow-xl backdrop-blur">
                    <button onClick={() => selectLevel(-1)} className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${level === -1 ? "text-gold" : ""}`}>
                      {t("player.auto")}
                    </button>
                    {levels.map((l) => (
                      <button
                        key={l.index}
                        onClick={() => selectLevel(l.index)}
                        className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${level === l.index ? "text-gold" : ""}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {captions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setCaptionMenu((m) => !m)}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"
                  aria-label={t("player.subtitles")}
                  aria-expanded={captionMenu}
                >
                  {caption >= 0 ? <Captions size={18} className="text-gold" /> : <CaptionsOff size={18} />}
                </button>
                {captionMenu && (
                  <div className="absolute bottom-11 right-0 max-h-64 w-40 overflow-y-auto rounded-lg border border-white/10 bg-ink-900/95 py-1 text-xs shadow-xl backdrop-blur">
                    <button
                      onClick={() => selectCaption(-1)}
                      className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${caption < 0 ? "text-gold" : ""}`}
                    >
                      {t("player.off")}
                    </button>
                    {captions.map((c) => (
                      <button
                        key={c.index}
                        onClick={() => selectCaption(c.index)}
                        className={`block w-full px-3 py-1.5 text-left hover:bg-white/10 ${caption === c.index ? "text-gold" : ""}`}
                      >
                        {c.label}
                        {c.lang ? <span className="ml-1 text-cream/40">({c.lang})</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={togglePip} className="hidden size-9 place-items-center rounded-full transition hover:bg-white/10 sm:grid" aria-label={t("player.pip")}>
              <PictureInPicture2 size={18} />
            </button>
            <button onClick={toggleFullscreen} className="grid size-9 place-items-center rounded-full transition hover:bg-white/10" aria-label={t("player.fullscreen")}>
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}