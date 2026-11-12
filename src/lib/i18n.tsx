/**
 * Interface language (English / Turkish). Two consumers:
 *  - React components: `useLang()` / `useT()` (via useSyncExternalStore, so a
 *    language switch re-renders every subscriber without a provider).
 *  - Data layer (tmdb.ts, api.ts, demo.ts, store.ts): `getLang()` +
 *    `translate()`, which read the current language at call time.
 * Changing the language also changes the TMDB `language` parameter, and the
 * TMDB cache key includes the request params, so nothing stale is served.
 */
import { useCallback, useSyncExternalStore } from "react";

export type Lang = "en" | "tr";

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "tr", label: "Türkçe", short: "TR" },
];

const STORAGE_KEY = "cineflow:lang:v1";
const listeners = new Set<() => void>();

const en = {
  "app.tagline": "Your own cinema",
  "app.description":
    "CineFlow — your own cinema. A static, serverless streaming interface for films and series, powered by TMDB.",

  "nav.home": "Home",
  "nav.films": "Films",
  "nav.series": "Series",
  "nav.library": "My library",
  "nav.search": "Search",
  "nav.settings": "Settings",
  "nav.menu": "Menu",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.language": "Language",
  "nav.switchTo": "Switch to {language}",
  "nav.skipToContent": "Skip to content",

  "footer.blurb":
    "A static, serverless cinema. Metadata and artwork by TMDB — this product uses the TMDB API but is not endorsed or certified by TMDB.",
  "footer.setup": "Setup & providers",
  "footer.top": "Back to top",

  "states.error": "Something went wrong",
  "states.retry": "Try again",
  "states.loading": "Loading",
  "states.empty": "Nothing here yet",

  "toast.dismiss": "Dismiss notification",

  "hero.feature": "Tonight's feature",
  "hero.demoFeature": "Demo feature",
  "hero.demo": "Demo",
  "hero.play": "Play",
  "hero.more": "More info",
  "hero.trailer": "Trailer",
  "hero.seasonOne": "{count} season",
  "hero.seasonMany": "{count} seasons",
  "hero.show": "Show “{title}”",
  "common.close": "Close",
  "title.addWatchlist": "Add to watchlist",
  "title.removeWatchlist": "Remove from watchlist",
  "toast.addedWatchlist": "Added “{title}” to your watchlist",
  "toast.removedWatchlist": "Removed “{title}” from your watchlist",
  "toast.addedFavourite": "Added “{title}” to your favourites",
  "toast.removedFavourite": "Removed “{title}” from your favourites",

  "meta.movie": "Film",
  "meta.tv": "Series",
  "meta.demo": "Demo",
  "meta.episode": "Episode {number}",

  "row.scrollLeft": "Scroll left",
  "row.scrollRight": "Scroll right",
  "row.resume": "Resume",
  "row.loading": "Loading",

  "home.title": "Home",
  "home.demoTitle": "Demo catalogue",
  "home.demoBody": "No TMDB key yet, so you are browsing a small built-in catalogue of real titles.",
  "home.demoCta": "Connect TMDB",
  "home.row.trending": "Trending this week",
  "home.row.acclaimed": "Critically acclaimed",
  "home.row.binge": "Binge-worthy series",
  "home.row.television": "The best of television",
  "home.row.soon": "Coming soon",
  "home.row.trendingFilms": "Trending films",
  "home.row.popularFilms": "Popular films",
  "home.row.worthStayingUp": "Series worth staying up for",
  "home.row.newNoteworthy": "New & noteworthy",
  "home.row.becauseYouLiked": "Because you liked {title}",
  "meta.untitled": "Untitled",
  "meta.released": "Released",
  "demo.episodeNote": "Demo episode. Add a TMDB key in Settings to load the real episode list.",
  "error.keyFormat": "That doesn't look like a TMDB key.",
  "error.keyEmpty": "The key is empty.",
  "error.keyStorage": "Your browser refused to store the key (storage disabled or full).",
  "error.type": "Type must be movie or tv.",

  "browse.eyebrow": "The collection",
  "browse.filmsTitle": "Every story, on your screen",
  "browse.filmsBlurb":
    "Browse the catalogue by genre, era and rating. Your next favourite is usually three rows down.",
  "browse.seriesTitle": "Series worth the binge",
  "browse.seriesBlurb": "Long-form storytelling, season by season. Filter the catalogue and settle in.",
  "browse.allGenres": "All genres",
  "browse.refine": "Refine",
  "browse.sortBy": "Sort by",
  "browse.releaseYear": "Release year",
  "browse.minRating": "Minimum rating",
  "browse.anyYear": "Any year",
  "browse.anyRating": "Any rating",
  "browse.clear": "Clear filters",
  "browse.sortPopular": "Most popular",
  "browse.sortRating": "Highest rated",
  "browse.sortNewest": "Newest first",
  "browse.sortOldest": "Oldest first",
  "browse.empty": "No titles match those filters",
  "browse.emptyBody": "Try widening the year range or lowering the minimum rating.",
  "browse.loadMore": "Load more",
  "browse.loading": "Loading…",
  "browse.endFilms": "End of the film catalogue",
  "browse.endSeries": "End of the series catalogue",
  "browse.counter": "Page {page} of {pages} · {count} shown",

  "search.title": "Find something",
  "search.prompt": "What are you in the mood for?",
  "search.placeholder": "Search films, series, people…",
  "search.everything": "Everything",
  "search.films": "Films",
  "search.series": "Series",
  "search.searching": "Searching the catalogue…",
  "search.results": "Results for “{query}”",
  "search.empty": "Nothing found for “{query}”",
  "search.reset": "Reset filters",
  "search.byGenre": "Browse by genre",
  "search.trending": "Trending this week",
  "search.browseAll": "Browse all films",
  "search.aria": "Search the catalogue",
  "search.clear": "Clear search",
  "search.year": "Year",
  "search.rating": "Rating",
  "search.count": "{count} titles · page {page}",
  "search.countOne": "{count} title · page {page}",
  "search.emptyBody":
    "Check the spelling or loosen the filters. Searching is powered by TMDB and only covers films and series.",

  "title.back": "Back",
  "title.play": "Play",
  "title.resume": "Resume {code}",
  "title.watchlist": "Watchlist",
  "title.inWatchlist": "In watchlist",
  "title.favourites": "Favourites",
  "title.inFavourites": "In favourites",
  "title.trailer": "Trailer",
  "title.storyline": "Storyline",
  "title.cast": "Cast",
  "title.seasons": "Seasons",
  "title.scrollLeft": "Previous seasons",
  "title.scrollRight": "Next seasons",
  "title.episodes": "Episodes",
  "title.noStill": "No still",
  "title.noDescription": "No description.",
  "title.details": "Details",
  "title.detailType": "Type",
  "title.detailReleased": "Released",
  "title.detailRuntime": "Runtime",
  "title.detailSeasons": "Seasons",
  "title.detailGenres": "Genres",
  "title.overviewEmpty": "No synopsis is available for this title yet.",
  "title.toggleFavourite": "Toggle favourite",
  "title.posterAlt": "{title} poster",
  "title.attribution":
    "Metadata and artwork from TMDB. Playback is handled by the providers you configure in settings.",
  "title.moreLikeThis": "More like this",
  "title.addedWatchlist": "Added to your watchlist",
  "title.removedWatchlist": "Removed from your watchlist",
  "title.addedFavourite": "Added to your favourites",
  "title.removedFavourite": "Removed from your favourites",
  "title.episodeCount": "{count} episodes",
  "title.markSeriesWatched": "Mark series watched",
  "title.markEpisodes": "Mark all episodes watched",
  "title.unmarkEpisodes": "Clear watched marks",
  "title.seasonCount": "{count} seasons",
  "title.episodesCount": "{count} episodes",
  "title.watchedProgress": "{watched} of {total} episodes watched",
  "title.seasonEpisodes": "{count} episodes",
  "title.seasonComplete": "Complete",
  "title.seasonWatched": "{watched} watched",
  "title.stopPoint": "Stopped at {time}",
  "title.episodeWatched": "Watched",
  "title.markEpisode": "Mark episode watched",
  "title.unmarkEpisode": "Mark episode unwatched",
  "title.seriesWatched": "Whole series marked watched",
  "title.seriesUnwatched": "All watched marks cleared",
  "watch.markedUnwatched": "Marked as unwatched",

  "library.eyebrow": "Your collection",
  "library.title": "My library",
  "library.watchlist": "Watchlist",
  "library.favourites": "Favourites",
  "library.description":
    "Everything you saved, and everywhere you left off. Stored in this browser — no account required.",
  "library.watchlistEmpty": "Your watchlist is empty",
  "library.watchlistEmptyBody": "Save films and series from any title page and they will wait for you here.",
  "library.favouritesEmpty": "No favourites yet",
  "library.favouritesEmptyBody": "Tap the heart on a title page to keep the ones you love close.",
  "library.removed": "Removed “{title}”",
  "library.removeAria": "Remove {title} from {list}",
  "library.listWatchlist": "watchlist",
  "library.listFavourites": "favourites",
  "library.browse": "Browse films",
  "library.continue": "Pick up where you left off",

  "watch.title": "Watch",
  "watch.remaining": "{time} remaining",
  "watch.sources": "Sources",
  "watch.noSources": "No playable source configured",
  "watch.noSourcesBody":
    "CineFlow ships with no third-party endpoints. Add a provider you are allowed to use in Settings, or connect your own HLS library.",
  "watch.openSettings": "Open settings",
  "watch.sourceNote": "Source note",
  "watch.markWatched": "Mark watched",
  "watch.watched": "Watched",
  "watch.reload": "Reload",
  "watch.retry": "Retry this source",
  "watch.next": "Next episode",
  "watch.previous": "Previous episode",
  "watch.episodeList": "All episodes",
  "watch.embedded": "Embedded player",
  "watch.disclaimer":
    "CineFlow only embeds the sources you configure; no video is hosted here.",
  "watch.statusUp": "Reachable",
  "watch.statusDown": "Unreachable",
  "watch.statusUnknown": "Not checked",
  "watch.checking": "Checking…",
  "watch.demoNote": "This is a demo title. Add a TMDB key in Settings for the real catalogue.",
  "watch.season": "Season {number}",
  "watch.back": "Back",
  "watch.loading": "Loading…",
  "watch.configure": "Configure providers",
  "watch.nowPlaying": "Now playing",
  "watch.sourceReload": "Reload source",
  "watch.loadingSources": "Loading sources…",
  "watch.checkingAvailability": "Checking availability…",
  "watch.probeBlocked": "Probe blocked — may still play",
  "watch.probeDown": "Reported unreachable",
  "watch.notVerified": "Not verified",
  "watch.loadedInBrowser": "Loaded in the browser.",
  "watch.externalPlayer": "External player.",
  "watch.externalPlayerBody":
    "Playback, subtitles and quality are controlled by {name}. CineFlow cannot read its timeline, so progress is not tracked automatically — use “Mark watched” to keep your library in sync.",
  "watch.directStream": "Direct stream.",
  "watch.directStreamBody": "Playback is handled inside CineFlow, so your position is saved automatically.",
  "watch.demoIdNote":
    "Demo titles use negative IDs, so external providers may answer with a 404 until a TMDB key is connected.",
  "watch.upNext": "Up next: {code} · {name}",
  "watch.previousLabel": "Previous ·",
  "watch.nextLabel": "Next ·",
  "watch.markedWatched": "Added to your watched list",
  "watch.switching": "{from} failed. Switching to {to}.",
  "watch.noOtherSources": "{reason} No other sources are configured.",
  "watch.timeoutReason": "The player did not respond in time.",
  "watch.seasonPicker": "Season",

  "settings.eyebrow": "Configuration",
  "settings.title": "Setup",
  "settings.subtitle":
    "Connect your metadata source and decide where video comes from. Everything is stored in this browser — nothing is sent to a server of ours, and there is no account.",
  "settings.languageTitle": "Language",
  "settings.languageBody":
    "Interface language. TMDB metadata (titles, overviews, genres) is requested in this language too.",
  "settings.tmdbTitle": "TMDB metadata",
  "settings.tmdbBody": "Posters, backdrops, ratings, trailers and episode data.",
  "settings.tmdbConnected": "Connected",
  "settings.tmdbDemo": "Demo mode",
  "settings.tmdbConfigured":
    "A TMDB key is configured. It is kept in this browser's localStorage and used to call TMDB directly from this device — anyone with access to this browser profile can read it, so avoid shared machines.",
  "settings.tmdbDisconnect": "Disconnect",
  "settings.tmdbDisconnectConfirm": "Disconnect TMDB? The app will fall back to the demo catalogue.",
  "settings.tmdbDisconnectedDemo": "TMDB disconnected. Demo mode is active.",
  "settings.tmdbDisconnectedEnv":
    "Stored key removed, but a build-time key (VITE_TMDB_API_KEY) is still in use.",
  "settings.tmdbKeyLabel": "API key or read access token",
  "settings.tmdbKeyPlaceholder": "Paste your TMDB v3 key or v4 read token",
  "settings.tmdbShow": "Show key",
  "settings.tmdbHide": "Hide key",
  "settings.tmdbVerifying": "Verifying…",
  "settings.tmdbConnect": "Connect",
  "settings.tmdbSaved": "TMDB connected. The real catalogue is now live.",
  "settings.tmdbHelpBefore": "Create a free key in your",
  "settings.tmdbHelpLink": "TMDB account settings",
  "settings.tmdbHelpAfter":
    ". The key is verified against TMDB, then stored in this browser only. On a public deployment, bake it in at build time with",
  "settings.tmdbHelpEnd": "instead of pasting it in.",
  "settings.providersTitle": "Playback providers",
  "settings.providersBody":
    "Lower priority numbers play first. If a source fails, CineFlow moves to the next one.",
  "settings.providerReset": "Reset",
  "settings.providerResetConfirm":
    "Restore the built-in provider presets? Your edits in this browser will be lost.",
  "settings.providerResetDone": "Provider presets restored.",
  "settings.addProvider": "Add provider",
  "settings.providerNew": "New provider",
  "settings.providersWarning":
    "CineFlow hosts nothing. The presets below are community-known embed routes, so verify each one for your region and terms before relying on it — or point the player at media you own.",
  "settings.providerUntitled": "Untitled provider",
  "settings.providerDemoOnly": "Demo only",
  "settings.providerOff": "off",
  "settings.providerMeta": "{kind} · {type} · priority {priority}",
  "settings.providerNoUrl": "no URL",
  "settings.providerEnable": "Enable {name}",
  "settings.providerDisable": "Disable {name}",
  "settings.providerEdit": "Edit provider",
  "settings.providerCollapse": "Collapse provider",
  "settings.providerName": "Name",
  "settings.providerId": "ID",
  "settings.providerKind": "Kind",
  "settings.providerIdType": "IDs",
  "settings.providerPriority": "Priority",
  "settings.providerEnabled": "Enabled",
  "settings.on": "On",
  "settings.off": "Off",
  "settings.providerMovieUrl": "Film URL template",
  "settings.providerTvUrl": "Series URL template",
  "settings.providerNote": "Note shown on the watch page",
  "settings.providerNotePlaceholder": "e.g. Third-party player. Quality depends on the source.",
  "settings.placeholders": "Placeholders: {list}",
  "settings.providerTest": "Test URL",
  "settings.providerRemove": "Remove",
  "settings.providerRemoveConfirm": "Remove the “{name}” provider?",
  "settings.providerAddUrlFirst": "Add a URL first.",
  "settings.providerSaved": "Provider settings saved.",
  "settings.savedIn": "Saved in:",
  "settings.howTitle": "How playback works",
  "settings.how1Title": "1. Provider order",
  "settings.how1Body":
    "Enabled sources are resolved for the title using TMDB or IMDb identifiers, sorted by priority.",
  "settings.how2Title": "2. Automatic fallback",
  "settings.how2Body":
    "If an iframe fails to load, or a direct stream errors, the next configured source is tried and marked.",
  "settings.how3Title": "3. Honest limits",
  "settings.how3Body":
    "External players do not expose progress, subtitles or quality to CineFlow, so the UI never claims they do.",
  "settings.ready": "Ready to browse?",
  "settings.backToCatalogue": "Back to the catalogue",
  "settings.unsaved": "You have unsaved provider changes.",
  "settings.discard": "Discard",
  "settings.save": "Save changes",
  "settings.storageTitle": "Local data",
  "settings.storageBody": "Watchlist, favourites, progress, cache and settings live in this browser only.",
  "settings.clearCache": "Clear cache",
  "settings.cacheCleared": "Cache cleared.",
  "settings.clearLibrary": "Clear library",
  "settings.clearLibraryConfirm": "Delete your watchlist, favourites and progress from this browser?",
  "settings.libraryCleared": "Library cleared.",

  "notfound.title": "This scene was cut",
  "notfound.body": "The page you are looking for does not exist, or the title has left the catalogue.",
  "notfound.home": "Back to home",

  "player.play": "Play",
  "player.pause": "Pause",
  "player.mute": "Mute",
  "player.unmute": "Unmute",
  "player.volume": "Volume",
  "player.seek": "Seek",
  "player.fullscreen": "Fullscreen",
  "player.pip": "Picture in picture",
  "player.subtitles": "Subtitles",
  "player.quality": "Playback quality",
  "player.back10": "Back 10 seconds",
  "player.forward10": "Forward 10 seconds",
  "player.auto": "Auto",
  "player.off": "Off",
  "player.track": "Track {id}",
  "player.loadFailed": "This video source could not be loaded.",
  "player.hlsUnsupported": "HLS playback is not supported in this browser.",
  "player.unreachable": "The stream is unreachable. Trying the next source may help.",
  "player.unreachableShort": "The stream is unreachable.",
  "player.playbackFailed": "Playback failed for this stream.",
  "player.hlsLoadFailed": "Could not load the HLS player.",
  "player.blocked": "The browser blocked playback. Press play to try again.",

  "error.storage": "Your browser refused to save data (storage full or disabled).",
  "error.invalidField": "Invalid {name}.",
  "error.unknownEndpoint": "Unknown endpoint: {path}",
  "error.titleNotFound": "Title not found.",
  "error.seasonNotFound": "Season not found.",
  "error.listNotFound": "List not found.",
  "error.noKey": "Add a TMDB key in Settings to browse the full catalogue.",
  "error.noKeySeasons": "Add a TMDB key in Settings to load episode lists.",
  "error.tmdbKey": "TMDB rejected the API key. Add a valid key in Settings.",
  "error.tmdbNetwork": "Could not reach TMDB. Check your connection and try again.",
  "error.tmdbRate": "TMDB is rate limiting requests. Try again in a moment.",
  "error.tmdbGeneric": "TMDB request failed.",
  "error.probeTimeout": "Timed out after 8s.",
  "error.probeUnreachable": "The browser could not reach this URL (DNS, TLS or network block).",
  "error.probeReachable":
    "The browser can reach this host, but cross-origin responses cannot be inspected. It may still play.",

  "error.providerName": "Provider needs an id and a name.",
  "error.providerUrl": "Provider URL must start with http(s): {url}",
  "error.providerUrlBare": "Provider URL must start with http(s).",
  "error.providerDuplicate": "Duplicate provider id: {id}",
  "error.providerStorage": "Your browser refused to save provider settings (storage full or disabled).",

  "provider.note.thirdParty": "Third-party player.",
  "provider.note.embedmaster":
    "Third-party player. Docs: https://embedmaster.com/documentation/ — takes a TMDB id or an IMDb id with the “tt” prefix.",
  "provider.note.vidcore": "Third-party player. Docs: https://vidcore.io",
  "provider.note.vidfast": "Third-party player. Docs: https://vidfast.vc",
  "provider.note.preset": "Preset. Add the provider's documented embed URL before enabling.",

  "unit.hourShort": "h",
  "unit.minuteShort": "m",
} as const;

export type MessageKey = keyof typeof en;

const tr: Record<MessageKey, string> = {
  "app.tagline": "Kendi sineman",
  "app.description":
    "CineFlow — kendi sineman. Film ve diziler için sunucusuz, statik bir izleme arayüzü; veriler TMDB'den gelir.",

  "nav.home": "Ana sayfa",
  "nav.films": "Filmler",
  "nav.series": "Diziler",
  "nav.library": "Kitaplığım",
  "nav.search": "Ara",
  "nav.settings": "Ayarlar",
  "nav.menu": "Menü",
  "nav.openMenu": "Menüyü aç",
  "nav.closeMenu": "Menüyü kapat",
  "nav.language": "Dil",
  "nav.switchTo": "{language} diline geç",
  "nav.skipToContent": "İçeriğe geç",

  "footer.blurb":
    "Sunucusuz, statik bir sinema. Veriler ve görseller TMDB'den gelir — bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamıştır.",
  "footer.setup": "Kurulum ve kaynaklar",
  "footer.top": "Başa dön",

  "states.error": "Bir şeyler ters gitti",
  "states.retry": "Tekrar dene",
  "states.loading": "Yükleniyor",
  "states.empty": "Burada henüz bir şey yok",

  "toast.dismiss": "Bildirimi kapat",

  "hero.feature": "Bu gecenin filmi",
  "hero.demoFeature": "Demo içerik",
  "hero.demo": "Demo",
  "hero.play": "Oynat",
  "hero.more": "Daha fazla",
  "hero.trailer": "Fragman",
  "hero.seasonOne": "{count} sezon",
  "hero.seasonMany": "{count} sezon",
  "hero.show": "“{title}” göster",
  "common.close": "Kapat",
  "title.addWatchlist": "İzleme listesine ekle",
  "title.removeWatchlist": "İzleme listesinden çıkar",
  "toast.addedWatchlist": "“{title}” izleme listene eklendi",
  "toast.removedWatchlist": "“{title}” izleme listenden çıkarıldı",
  "toast.addedFavourite": "“{title}” favorilerine eklendi",
  "toast.removedFavourite": "“{title}” favorilerinden çıkarıldı",

  "meta.movie": "Film",
  "meta.tv": "Dizi",
  "meta.demo": "Demo",
  "meta.episode": "{number}. bölüm",

  "row.scrollLeft": "Sola kaydır",
  "row.scrollRight": "Sağa kaydır",
  "row.resume": "Devam et",
  "row.loading": "Yükleniyor",

  "home.title": "Ana sayfa",
  "home.demoTitle": "Demo katalog",
  "home.demoBody": "Henüz TMDB anahtarı yok; gerçek başlıklardan oluşan küçük bir yerleşik kataloğa göz atıyorsun.",
  "home.demoCta": "TMDB'ye bağlan",
  "home.row.trending": "Bu hafta trend",
  "home.row.acclaimed": "Eleştirmenlerin beğendikleri",
  "home.row.binge": "Ardı ardına izlenecek diziler",
  "home.row.television": "Televizyonun en iyileri",
  "home.row.soon": "Yakında",
  "home.row.trendingFilms": "Trenddeki filmler",
  "home.row.popularFilms": "Popüler filmler",
  "home.row.worthStayingUp": "Uykusuz kalmaya değer diziler",
  "home.row.newNoteworthy": "Yeni ve dikkat çekici",
  "home.row.becauseYouLiked": "{title} filmini sevdiğin için",
  "meta.untitled": "Adsız",
  "meta.released": "Yayında",
  "demo.episodeNote": "Demo bölüm. Gerçek bölüm listesi için Ayarlar'dan bir TMDB anahtarı ekle.",
  "error.keyFormat": "Bu bir TMDB anahtarına benzemiyor.",
  "error.keyEmpty": "Anahtar boş.",
  "error.keyStorage": "Tarayıcın anahtarı saklamayı reddetti (depolama kapalı ya da dolu).",
  "error.type": "Tür movie ya da tv olmalı.",

  "browse.eyebrow": "Koleksiyon",
  "browse.filmsTitle": "Her hikâye, senin ekranında",
  "browse.filmsBlurb": "Kataloğa türe, döneme ve puana göre göz at. Bir sonraki favorin genelde üç sıra aşağıda.",
  "browse.seriesTitle": "Ardı ardına izlemeye değer diziler",
  "browse.seriesBlurb": "Sezon sezon uzun soluklu hikâyeler. Kataloğu filtrele ve yerleş.",
  "browse.allGenres": "Tüm türler",
  "browse.refine": "Filtrele",
  "browse.sortBy": "Sırala",
  "browse.releaseYear": "Çıkış yılı",
  "browse.minRating": "En az puan",
  "browse.anyYear": "Tüm yıllar",
  "browse.anyRating": "Tüm puanlar",
  "browse.clear": "Filtreleri temizle",
  "browse.sortPopular": "En popüler",
  "browse.sortRating": "En yüksek puan",
  "browse.sortNewest": "En yeni",
  "browse.sortOldest": "En eski",
  "browse.empty": "Bu filtrelerle eşleşen başlık yok",
  "browse.emptyBody": "Yıl aralığını genişletmeyi ya da en az puanı düşürmeyi dene.",
  "browse.loadMore": "Daha fazla yükle",
  "browse.loading": "Yükleniyor…",
  "browse.endFilms": "Film kataloğunun sonu",
  "browse.endSeries": "Dizi kataloğunun sonu",
  "browse.counter": "Sayfa {page}/{pages} · {count} sonuç",

  "search.title": "Bir şeyler bul",
  "search.prompt": "Ne izlemek istersin?",
  "search.placeholder": "Film, dizi, kişi ara…",
  "search.everything": "Her şey",
  "search.films": "Filmler",
  "search.series": "Diziler",
  "search.searching": "Katalog aranıyor…",
  "search.results": "“{query}” için sonuçlar",
  "search.empty": "“{query}” için sonuç bulunamadı",
  "search.reset": "Filtreleri sıfırla",
  "search.byGenre": "Türe göre göz at",
  "search.trending": "Bu hafta trend",
  "search.browseAll": "Tüm filmlere göz at",
  "search.aria": "Katalogda ara",
  "search.clear": "Aramayı temizle",
  "search.year": "Yıl",
  "search.rating": "Puan",
  "search.count": "{count} başlık · sayfa {page}",
  "search.countOne": "{count} başlık · sayfa {page}",
  "search.emptyBody":
    "Yazımı kontrol et ya da filtreleri gevşet. Arama TMDB tarafından sağlanır ve yalnızca film ile dizileri kapsar.",

  "title.back": "Geri",
  "title.play": "Oynat",
  "title.resume": "{code} devam et",
  "title.watchlist": "İzleme listesi",
  "title.inWatchlist": "İzleme listemde",
  "title.favourites": "Favoriler",
  "title.inFavourites": "Favorilerimde",
  "title.trailer": "Fragman",
  "title.storyline": "Konu",
  "title.cast": "Oyuncular",
  "title.seasons": "Sezonlar",
  "title.scrollLeft": "Önceki sezonlar",
  "title.scrollRight": "Sonraki sezonlar",
  "title.episodes": "Bölümler",
  "title.noStill": "Görsel yok",
  "title.noDescription": "Açıklama yok.",
  "title.details": "Bilgiler",
  "title.detailType": "Tür",
  "title.detailReleased": "Yayın",
  "title.detailRuntime": "Süre",
  "title.detailSeasons": "Sezon",
  "title.detailGenres": "Türler",
  "title.overviewEmpty": "Bu başlık için henüz özet yok.",
  "title.toggleFavourite": "Favoriye ekle ya da çıkar",
  "title.posterAlt": "{title} afişi",
  "title.attribution":
    "Meta veriler ve görseller TMDB'den gelir. Oynatma, ayarlarda tanımladığın sağlayıcılar tarafından yapılır.",
  "title.moreLikeThis": "Benzerleri",
  "title.addedWatchlist": "İzleme listene eklendi",
  "title.removedWatchlist": "İzleme listenden çıkarıldı",
  "title.addedFavourite": "Favorilerine eklendi",
  "title.removedFavourite": "Favorilerinden çıkarıldı",
  "title.episodeCount": "{count} bölüm",
  "title.markSeriesWatched": "Diziyi izlendi işaretle",
  "title.markEpisodes": "Tüm bölümleri izlendi işaretle",
  "title.unmarkEpisodes": "İzlenen işaretlerini temizle",
  "title.seasonCount": "{count} sezon",
  "title.episodesCount": "{count} bölüm",
  "title.watchedProgress": "{total} bölümden {watched} izlendi",
  "title.seasonEpisodes": "{count} bölüm",
  "title.seasonComplete": "Tamamlandı",
  "title.seasonWatched": "{watched} izlendi",
  "title.stopPoint": "Kaldığınız yer: {time}",
  "title.episodeWatched": "İzlendi",
  "title.markEpisode": "Bölümü izlendi işaretle",
  "title.unmarkEpisode": "Bölüm işaretini kaldır",
  "title.seriesWatched": "Dizi tamamen izlendi işaretlendi",
  "title.seriesUnwatched": "Tüm izlenen işaretleri temizlendi",
  "watch.markedUnwatched": "İzlendi işareti kaldırıldı",

  "library.eyebrow": "Koleksiyonun",
  "library.title": "Kitaplığım",
  "library.watchlist": "İzleme listesi",
  "library.favourites": "Favoriler",
  "library.description":
    "Kaydettiğin her şey ve bıraktığın her yer. Bu tarayıcıda saklanır — hesap gerekmez.",
  "library.watchlistEmpty": "İzleme listen boş",
  "library.watchlistEmptyBody": "Herhangi bir başlık sayfasından film ve dizi kaydet; burada seni beklesinler.",
  "library.favouritesEmpty": "Henüz favori yok",
  "library.favouritesEmptyBody": "Sevdiklerini yakınında tutmak için başlık sayfasındaki kalbe dokun.",
  "library.removed": "“{title}” kaldırıldı",
  "library.removeAria": "{title} başlığını {list} listesinden kaldır",
  "library.listWatchlist": "izleme",
  "library.listFavourites": "favori",
  "library.browse": "Filmlere göz at",
  "library.continue": "Bıraktığın yerden devam et",

  "watch.title": "İzle",
  "watch.remaining": "{time} kaldı",
  "watch.sources": "Kaynaklar",
  "watch.noSources": "Oynatılabilir kaynak yok",
  "watch.noSourcesBody":
    "CineFlow üçüncü taraf bir adresle gelmez. Kullanma iznin olan bir sağlayıcıyı Ayarlar'dan ekle ya da kendi HLS arşivini bağla.",
  "watch.openSettings": "Ayarları aç",
  "watch.sourceNote": "Kaynak notu",
  "watch.markWatched": "İzledim",
  "watch.watched": "İzlendi",
  "watch.reload": "Yenile",
  "watch.retry": "Bu kaynağı yeniden dene",
  "watch.next": "Sonraki bölüm",
  "watch.previous": "Önceki bölüm",
  "watch.episodeList": "Tüm bölümler",
  "watch.embedded": "Gömülü oynatıcı",
  "watch.disclaimer": "CineFlow yalnızca senin tanımladığın kaynakları gömer; burada hiçbir video barındırılmaz.",
  "watch.statusUp": "Erişilebilir",
  "watch.statusDown": "Erişilemiyor",
  "watch.statusUnknown": "Denetlenmedi",
  "watch.checking": "Denetleniyor…",
  "watch.demoNote": "Bu bir demo başlık. Gerçek katalog için Ayarlar'dan TMDB anahtarı ekle.",
  "watch.season": "{number}. sezon",
  "watch.back": "Geri",
  "watch.loading": "Yükleniyor…",
  "watch.configure": "Kaynakları ayarla",
  "watch.nowPlaying": "Şimdi oynuyor",
  "watch.sourceReload": "Kaynağı yenile",
  "watch.loadingSources": "Kaynaklar yükleniyor…",
  "watch.checkingAvailability": "Erişim denetleniyor…",
  "watch.probeBlocked": "Denetim engellendi — yine de oynayabilir",
  "watch.probeDown": "Erişilemiyor olarak bildirildi",
  "watch.notVerified": "Doğrulanmadı",
  "watch.loadedInBrowser": "Tarayıcıda yüklendi.",
  "watch.externalPlayer": "Harici oynatıcı.",
  "watch.externalPlayerBody":
    "Oynatma, alt yazı ve kalite {name} tarafından yönetilir. CineFlow onun zaman çizelgesini okuyamadığı için ilerleme otomatik kaydedilmez — listeni güncel tutmak için “İzledim”i kullan.",
  "watch.directStream": "Doğrudan yayın.",
  "watch.directStreamBody": "Oynatma CineFlow içinde yapılır, bu yüzden kaldığın yer otomatik kaydedilir.",
  "watch.demoIdNote":
    "Demo başlıklar negatif kimlik kullanır; TMDB anahtarı bağlanana kadar harici kaynaklar 404 dönebilir.",
  "watch.upNext": "Sırada: {code} · {name}",
  "watch.previousLabel": "Önceki ·",
  "watch.nextLabel": "Sonraki ·",
  "watch.markedWatched": "İzlenenlere eklendi",
  "watch.switching": "{from} başarısız oldu. {to} kaynağına geçiliyor.",
  "watch.noOtherSources": "{reason} Başka kaynak tanımlı değil.",
  "watch.timeoutReason": "Oynatıcı zamanında yanıt vermedi.",
  "watch.seasonPicker": "Sezon",

  "settings.eyebrow": "Yapılandırma",
  "settings.title": "Kurulum",
  "settings.subtitle":
    "Veri kaynağını bağla ve videonun nereden geldiğine karar ver. Her şey bu tarayıcıda saklanır — bizim sunucumuza hiçbir şey gönderilmez, hesap da gerekmez.",
  "settings.languageTitle": "Dil",
  "settings.languageBody": "Arayüz dili. TMDB verileri (adlar, özetler, türler) de bu dilde istenir.",
  "settings.tmdbTitle": "TMDB verileri",
  "settings.tmdbBody": "Afişler, arka planlar, puanlar, fragmanlar ve bölüm bilgileri.",
  "settings.tmdbConnected": "Bağlı",
  "settings.tmdbDemo": "Demo modu",
  "settings.tmdbConfigured":
    "TMDB anahtarı tanımlı. Bu tarayıcının localStorage'ında tutulur ve TMDB'yi doğrudan bu cihazdan çağırmak için kullanılır — bu tarayıcı profiline erişebilen herkes okuyabilir, ortak makinelerde kullanma.",
  "settings.tmdbDisconnect": "Bağlantıyı kes",
  "settings.tmdbDisconnectConfirm": "TMDB bağlantısı kesilsin mi? Uygulama demo kataloğa döner.",
  "settings.tmdbDisconnectedDemo": "TMDB bağlantısı kesildi. Demo modu etkin.",
  "settings.tmdbDisconnectedEnv":
    "Saklanan anahtar kaldırıldı ama derleme zamanı anahtarı (VITE_TMDB_API_KEY) hâlâ kullanılıyor.",
  "settings.tmdbKeyLabel": "API anahtarı veya okuma erişim belirteci",
  "settings.tmdbKeyPlaceholder": "TMDB v3 anahtarını ya da v4 okuma belirtecini yapıştır",
  "settings.tmdbShow": "Anahtarı göster",
  "settings.tmdbHide": "Anahtarı gizle",
  "settings.tmdbVerifying": "Doğrulanıyor…",
  "settings.tmdbConnect": "Bağlan",
  "settings.tmdbSaved": "TMDB bağlandı. Gerçek katalog artık yayında.",
  "settings.tmdbHelpBefore": "Ücretsiz bir anahtar için",
  "settings.tmdbHelpLink": "TMDB hesap ayarları",
  "settings.tmdbHelpAfter":
    " sayfasına git. Anahtar TMDB'ye karşı doğrulanır ve yalnızca bu tarayıcıda saklanır. Herkese açık bir yayında yapıştırmak yerine derleme sırasında şununla göm:",
  "settings.tmdbHelpEnd": ".",
  "settings.providersTitle": "Oynatma sağlayıcıları",
  "settings.providersBody":
    "Küçük öncelik numaraları önce oynar. Bir kaynak başarısız olursa CineFlow bir sonrakine geçer.",
  "settings.providerReset": "Sıfırla",
  "settings.providerResetConfirm":
    "Yerleşik sağlayıcı şablonları geri yüklensin mi? Bu tarayıcıdaki değişiklikler kaybolur.",
  "settings.providerResetDone": "Sağlayıcı şablonları geri yüklendi.",
  "settings.addProvider": "Sağlayıcı ekle",
  "settings.providerNew": "Yeni sağlayıcı",
  "settings.providersWarning":
    "CineFlow hiçbir içeriği barındırmaz. Aşağıdaki şablonlar toplulukça bilinen gömme adresleridir; güvenmeden önce her birini bölgen ve koşulların için doğrula — ya da oynatıcıyı sahibi olduğun medyaya yönlendir.",
  "settings.providerUntitled": "Adsız sağlayıcı",
  "settings.providerDemoOnly": "Sadece demo",
  "settings.providerOff": "kapalı",
  "settings.providerMeta": "{kind} · {type} · öncelik {priority}",
  "settings.providerNoUrl": "URL yok",
  "settings.providerEnable": "{name} aç",
  "settings.providerDisable": "{name} kapat",
  "settings.providerEdit": "Sağlayıcıyı düzenle",
  "settings.providerCollapse": "Sağlayıcıyı kapat",
  "settings.providerName": "Ad",
  "settings.providerId": "Kimlik",
  "settings.providerKind": "Tür",
  "settings.providerIdType": "Kimlikler",
  "settings.providerPriority": "Öncelik",
  "settings.providerEnabled": "Etkin",
  "settings.on": "Açık",
  "settings.off": "Kapalı",
  "settings.providerMovieUrl": "Film URL şablonu",
  "settings.providerTvUrl": "Dizi URL şablonu",
  "settings.providerNote": "İzleme sayfasında gösterilecek not",
  "settings.providerNotePlaceholder": "örn. Üçüncü taraf oynatıcı. Kalite kaynağa bağlıdır.",
  "settings.placeholders": "Yer tutucular: {list}",
  "settings.providerTest": "URL'yi dene",
  "settings.providerRemove": "Kaldır",
  "settings.providerRemoveConfirm": "“{name}” sağlayıcısı kaldırılsın mı?",
  "settings.providerAddUrlFirst": "Önce bir URL ekle.",
  "settings.providerSaved": "Sağlayıcı ayarları kaydedildi.",
  "settings.savedIn": "Kayıt yeri:",
  "settings.howTitle": "Oynatma nasıl çalışır",
  "settings.how1Title": "1. Sağlayıcı sırası",
  "settings.how1Body":
    "Etkin kaynaklar başlık için TMDB veya IMDb kimliğiyle çözülür ve önceliğe göre sıralanır.",
  "settings.how2Title": "2. Otomatik yedek",
  "settings.how2Body":
    "Bir iframe yüklenemezse ya da doğrudan yayın hata verirse sıradaki kaynak denenir ve işaretlenir.",
  "settings.how3Title": "3. Dürüst sınırlar",
  "settings.how3Body":
    "Harici oynatıcılar ilerlemeyi, alt yazıyı veya kaliteyi CineFlow'a bildirmez; arayüz de bunu iddia etmez.",
  "settings.ready": "Gözatmaya hazır mısın?",
  "settings.backToCatalogue": "Kataloğa dön",
  "settings.unsaved": "Kaydedilmemiş sağlayıcı değişikliklerin var.",
  "settings.discard": "Vazgeç",
  "settings.save": "Değişiklikleri kaydet",
  "settings.storageTitle": "Yerel veriler",
  "settings.storageBody": "İzleme listesi, favoriler, ilerleme, önbellek ve ayarlar yalnızca bu tarayıcıda tutulur.",
  "settings.clearCache": "Önbelleği temizle",
  "settings.cacheCleared": "Önbellek temizlendi.",
  "settings.clearLibrary": "Kitaplığı temizle",
  "settings.clearLibraryConfirm": "İzleme listen, favorilerin ve ilerlemen bu tarayıcıdan silinsin mi?",
  "settings.libraryCleared": "Kitaplık temizlendi.",

  "notfound.title": "Bu sahne kesilmiş",
  "notfound.body": "Aradığın sayfa yok ya da başlık katalogdan çıkmış.",
  "notfound.home": "Ana sayfaya dön",

  "player.play": "Oynat",
  "player.pause": "Duraklat",
  "player.mute": "Sesi kapat",
  "player.unmute": "Sesi aç",
  "player.volume": "Ses düzeyi",
  "player.seek": "İlerlet",
  "player.fullscreen": "Tam ekran",
  "player.pip": "Pencere içinde pencere",
  "player.subtitles": "Alt yazılar",
  "player.quality": "Oynatma kalitesi",
  "player.back10": "10 saniye geri",
  "player.forward10": "10 saniye ileri",
  "player.auto": "Otomatik",
  "player.off": "Kapalı",
  "player.track": "Parça {id}",
  "player.loadFailed": "Bu video kaynağı yüklenemedi.",
  "player.hlsUnsupported": "Bu tarayıcı HLS oynatmayı desteklemiyor.",
  "player.unreachable": "Yayına ulaşılamıyor. Bir sonraki kaynağı denemek işe yarayabilir.",
  "player.unreachableShort": "Yayına ulaşılamıyor.",
  "player.playbackFailed": "Bu yayın için oynatma başarısız oldu.",
  "player.hlsLoadFailed": "HLS oynatıcı yüklenemedi.",
  "player.blocked": "Tarayıcı oynatmayı engelledi. Denemek için Oynat'a bas.",

  "error.storage": "Tarayıcın veri kaydetmeyi reddetti (depolama dolu ya da kapalı).",
  "error.invalidField": "Geçersiz değer: {name}.",
  "error.unknownEndpoint": "Bilinmeyen uç nokta: {path}",
  "error.titleNotFound": "Başlık bulunamadı.",
  "error.seasonNotFound": "Sezon bulunamadı.",
  "error.listNotFound": "Liste bulunamadı.",
  "error.noKey": "Tüm kataloğa göz atmak için Ayarlar'dan bir TMDB anahtarı ekle.",
  "error.noKeySeasons": "Bölüm listelerini yüklemek için Ayarlar'dan bir TMDB anahtarı ekle.",
  "error.tmdbKey": "TMDB API anahtarını reddetti. Ayarlar'dan geçerli bir anahtar ekle.",
  "error.tmdbNetwork": "TMDB'ye ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
  "error.tmdbRate": "TMDB istekleri sınırlıyor. Birazdan tekrar dene.",
  "error.tmdbGeneric": "TMDB isteği başarısız oldu.",
  "error.probeTimeout": "8 saniye sonra zaman aşımına uğradı.",
  "error.probeUnreachable": "Tarayıcı bu adrese ulaşamadı (DNS, TLS ya da ağ engeli).",
  "error.probeReachable":
    "Tarayıcı bu sunucuya ulaşabiliyor ama alan adları farklı olduğu için yanıt incelenemiyor. Yine de oynatabilir.",

  "error.providerName": "Sağlayıcının bir kimliği ve adı olmalı.",
  "error.providerUrl": "Sağlayıcı adresi http(s) ile başlamalı: {url}",
  "error.providerUrlBare": "Sağlayıcı adresi http(s) ile başlamalı.",
  "error.providerDuplicate": "Sağlayıcı kimliği birden fazla kez kullanılmış: {id}",
  "error.providerStorage": "Tarayıcı sağlayıcı ayarlarını kaydetmedi (depolama dolu ya da kapalı).",

  "provider.note.thirdParty": "Üçüncü taraf oynatıcı.",
  "provider.note.embedmaster":
    "Üçüncü taraf oynatıcı. Belgeler: https://embedmaster.com/documentation/ — TMDB kimliği ya da “tt” önekli IMDb kimliği kabul eder.",
  "provider.note.vidcore": "Üçüncü taraf oynatıcı. Belgeler: https://vidcore.io",
  "provider.note.vidfast": "Üçüncü taraf oynatıcı. Belgeler: https://vidfast.vc",
  "provider.note.preset": "Hazır şablon. Etkinleştirmeden önce sağlayıcının belgelenmiş gömme adresini ekle.",

  "unit.hourShort": "sa",
  "unit.minuteShort": "dk",
};

const MESSAGES: Record<Lang, Record<MessageKey, string>> = { en, tr };

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "tr";
}

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* storage blocked — fall through to the browser preference */
  }
  try {
    const preferred = navigator.languages?.find((tag) => tag.toLowerCase().startsWith("tr"));
    if (preferred) return "tr";
  } catch {
    /* no navigator — keep English */
  }
  return "en";
}

let current: Lang = detectLang();

function applyDocumentLang(lang: Lang): void {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}
applyDocumentLang(current);

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (!isLang(lang) || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage blocked — the choice still applies for this session */
  }
  applyDocumentLang(lang);
  listeners.forEach((listener) => listener());
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** TMDB wants "tr-TR" / "en-US"; every request is sent with this value. */
export function tmdbLanguage(lang: Lang = current): string {
  return lang === "tr" ? "tr-TR" : "en-US";
}

/** Locale for numbers, dates and Intl formatting. */
export function locale(lang: Lang = current): string {
  return lang === "tr" ? "tr-TR" : "en-US";
}

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = MESSAGES[lang]?.[key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/** Translate with the current language — for the data layer (no React). */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  return translate(current, key, vars);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}

export function useT(): (key: MessageKey, vars?: Record<string, string | number>) => string {
  const lang = useLang();
  return useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}

export { MESSAGES };
