# CineFlow

A cinematic streaming interface for films and series — **as a fully static site**. No server, no database, no build-time
backend: the app is a single-page bundle you can host on GitHub Pages, Netlify, Cloudflare Pages or any static bucket.

Metadata comes from TMDB (called directly from the browser), your watchlist and progress live in the browser's
localStorage, and playback comes from providers **you** configure. CineFlow hosts no media.

- Dark, responsive UI with cinematic hero art, carousels, discovery filters and a real video player.
- Watchlist, favourites, continue watching — stored per browser, no accounts.
- Provider registry with priorities, browser-side reachability probes and automatic fallback.
- Direct HLS/MP4 playback with full controls, quality selection, PiP and resume — or embed a third-party player.
- TMDB responses cached in localStorage so the API is not hammered.
- Demo mode: with no key the app runs on sample data with locally generated SVG artwork, so nothing is ever blank.

## Requirements

Node.js **20+** for building. The output is static, so hosting needs nothing at all.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # writes dist/
npm run preview    # serves dist/ locally
```

Open the app, go to **Settings**, and paste a TMDB key (v3 API key or v4 read token). Until you do, the app runs in
demo mode.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/`.

`vite.config.ts` uses `base: "./"`, so the build works at `https://user.github.io/<repo>/` without changes, and routing
uses hash URLs (`#/title/movie/693134`) so deep links and refreshes work without any 404 rewrite rules.

Any other static host works the same way: upload the contents of `dist/`.

## The TMDB key, and what "public" means

There is no server to keep the key on, so it is used in the browser:

- Paste it in **Settings** → stored in this browser's localStorage (per device, per browser profile).
- Or bake it in at build time with `VITE_TMDB_API_KEY` (see `.env.example`) — convenient for a personal deployment,
  but **anything in a Vite bundle is public**: anyone can read it in DevTools. Use a key you are willing to expose, or
  keep the demo catalogue.

Because the key is visible to whoever uses the browser, avoid entering it on shared machines.

## Providers

Providers are no longer read from `config/providers.json` (a static site cannot read files at runtime). The presets ship
inside the bundle and your edits are saved in localStorage from **Settings → Playback providers**; the **Reset** button
restores the defaults.

```json
{
  "id": "embedmaster",
  "name": "EmbedMaster",
  "kind": "iframe",
  "enabled": true,
  "priority": 0,
  "idType": "tmdb",
  "movie": "https://embedmaster.link/movie/{id}",
  "tv": "https://embedmaster.link/tv/{id}/{season}/{episode}",
  "note": "Third-party player."
}
```

Placeholders: `{id}`/`{tmdbId}`, `{imdbId}`, `{type}`, `{season}`, `{episode}`, `{year}`. Lower `priority` plays first.
`kind` is `iframe` (external player), `hls` (m3u8, played by CineFlow) or `file` (progressive MP4).

### What is preset, and how far to trust it

CineFlow hosts nothing. The presets are routes that the community uses; none of these services publishes a stable,
licensed embed API, so treat them as a starting point rather than a guarantee:

Defaults, in play order (lower `priority` first):

| Provider | Route preset | Enabled |
| --- | --- | --- |
| EmbedMaster | `https://embedmaster.link/movie/{id}`, `/tv/{id}/{season}/{episode}` | yes |
| VidCore | `https://vidcore.io/movie/{id}`, `/tv/{id}/{season}/{episode}` | no |
| VidFast | `https://vidfast.vc/movie/{id}`, `/tv/{id}/{season}/{episode}` | yes |
| VidAPI | `/embed/movie/{id}`, `/embed/tv/{id}/{season}/{episode}` | no |
| VidSrc | `/embed/movie/{id}`, `/embed/tv/{id}/{season}/{episode}` | no |
| AutoEmbed | `/movie/tmdb/{id}`, `/tv/tmdb/{id}-{season}-{episode}` | no |
| Other provider | fill in from the service's docs | no |

EmbedMaster ([docs](https://embedmaster.com/documentation/)) and VidCore accept a TMDB id or an IMDb id with the
`tt` prefix; the presets pass the TMDB id. EmbedMaster's docs forbid a `sandbox` attribute on its iframe, so the watch
page never sets one.

Limits are stated in the UI rather than hidden: external iframes cannot report playback position, quality or subtitles
to CineFlow, so the watch page offers “Mark watched” instead of faking a progress bar.

Availability probes now run in the browser, so they are honest about their own limits: a cross-origin response is opaque
to JavaScript, so CineFlow can only say whether the host was reachable — never that a player definitely works.

## Architecture

```
src/lib/tmdb.ts        TMDB client + localStorage cache, key handling
src/lib/store.ts       watchlist, favourites, progress (localStorage)
src/lib/providers.ts   provider registry, resolution, browser probes
src/lib/demo.ts        offline sample catalogue
src/lib/art.ts         locally generated SVG artwork (data URIs)
src/lib/api.ts         thin facade the components call (useApi paths)
src/pages, src/components, src/player    React 19 + Tailwind 4 UI
```

`dist/` is the deployable artefact. Nothing else is needed at runtime.

## Notes and limits

- Player shortcuts: `space`/`k` play-pause, `←`/`→` ±10s, `f` fullscreen, `m` mute.
- Resume and progress are only tracked for `hls`/`file` providers.
- Library and progress are per browser profile: clearing site data clears them, and they do not sync across devices.
- `iframe` providers control their own quality, subtitles and tracking; their URLs may change without notice.
- The demo catalogue is sample data with locally generated SVG art. It exists so the app is usable before setup.

This product uses the TMDB API but is not endorsed or certified by TMDB.
