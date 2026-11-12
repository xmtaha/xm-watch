/**
 * Offline demo catalogue, used whenever no TMDB key is configured so the app is
 * usable (and honest) before setup. Every artwork is generated locally in the
 * browser by art.ts — no external assets, no scraped metadata.
 */
import { artUrl } from "./art";
import { getLang, t } from "./i18n";
import type { MediaType, Page, SeasonResponse, Title } from "./types";

interface DemoItem {
  id: number;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  cast: string[];
  overview: string;
  runtime?: number;
  seasons?: number;
}

export const demoMovies: DemoItem[] = [
  { id: -1, title: "Dune", year: 2021, rating: 7.8, genres: ["Science Fiction", "Adventure"], runtime: 155, cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac"], overview: "A gifted heir is thrust into a desert world where politics, prophecy and survival collide around the most valuable substance in the universe." },
  { id: -2, title: "Arrival", year: 2016, rating: 7.6, genres: ["Science Fiction", "Drama"], runtime: 116, cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker"], overview: "A linguist is recruited to communicate with visitors whose language may rewrite the way she experiences time itself." },
  { id: -3, title: "Blade Runner 2049", year: 2017, rating: 7.6, genres: ["Science Fiction", "Thriller"], runtime: 164, cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"], overview: "A blade runner uncovers a secret buried long enough to tear apart what remains of society — and his own sense of self." },
  { id: -4, title: "Interstellar", year: 2014, rating: 8.4, genres: ["Science Fiction", "Drama"], runtime: 169, cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"], overview: "With Earth failing, a former pilot joins a mission through a wormhole to find a future for the people he left behind." },
  { id: -5, title: "Inception", year: 2010, rating: 8.4, genres: ["Science Fiction", "Action"], runtime: 148, cast: ["Leonardo DiCaprio", "Marion Cotillard", "Elliot Page"], overview: "A specialist in stealing ideas from dreams is offered one last job: plant an idea instead, and make it stick." },
  { id: -6, title: "The Batman", year: 2022, rating: 7.6, genres: ["Crime", "Mystery"], runtime: 176, cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"], overview: "A young detective in a cape follows a trail of riddles through a city rotting from the inside." },
  { id: -7, title: "Parasite", year: 2019, rating: 8.5, genres: ["Thriller", "Drama"], runtime: 133, cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"], overview: "A struggling family talks its way into the household of the wealthy — and finds the arrangement has a cost nobody priced in." },
  { id: -8, title: "Whiplash", year: 2014, rating: 8.4, genres: ["Drama", "Music"], runtime: 107, cast: ["Miles Teller", "J.K. Simmons"], overview: "A young drummer chases greatness under a teacher who believes cruelty is the only honest form of encouragement." },
  { id: -9, title: "Mad Max: Fury Road", year: 2015, rating: 8.1, genres: ["Action", "Adventure"], runtime: 120, cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"], overview: "One long, roaring escape across a wasteland, where a war rig carries a rebellion and a great deal of fuel." },
  { id: -10, title: "Everything Everywhere All at Once", year: 2022, rating: 7.8, genres: ["Science Fiction", "Comedy"], runtime: 139, cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu"], overview: "A laundromat owner discovers that every life she didn't live is a weapon she can borrow." },
  { id: -11, title: "The Grand Budapest Hotel", year: 2014, rating: 8.1, genres: ["Comedy", "Drama"], runtime: 99, cast: ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan"], overview: "A concierge and his lobby boy become entangled in a stolen painting, a family fortune and the end of an era." },
  { id: -12, title: "Nightcrawler", year: 2014, rating: 7.8, genres: ["Crime", "Thriller"], runtime: 117, cast: ["Jake Gyllenhaal", "Rene Russo", "Riz Ahmed"], overview: "A freelance cameraman discovers that the market for terrible news rewards the people willing to get closest." },
  { id: -13, title: "Sicario", year: 2015, rating: 7.6, genres: ["Thriller", "Crime"], runtime: 121, cast: ["Emily Blunt", "Benicio del Toro", "Josh Brolin"], overview: "An idealistic agent is pulled into a task force operating on the wrong side of the rules she swore to keep." },
  { id: -14, title: "Heat", year: 1995, rating: 8.3, genres: ["Crime", "Thriller"], runtime: 170, cast: ["Al Pacino", "Robert De Niro", "Val Kilmer"], overview: "A detective and a professional thief circle each other across a city that never quite gives either of them cover." },
  { id: -15, title: "The Social Network", year: 2010, rating: 8.0, genres: ["Drama", "History"], runtime: 121, cast: ["Jesse Eisenberg", "Andrew Garfield", "Armie Hammer"], overview: "A website built in a dorm room becomes a company, a lawsuit and a very expensive way to lose a friend." },
  { id: -16, title: "Gone Girl", year: 2014, rating: 8.1, genres: ["Thriller", "Mystery"], runtime: 149, cast: ["Ben Affleck", "Rosamund Pike", "Neil Patrick Harris"], overview: "A wife disappears on an anniversary, and the story the media tells is not the story anyone involved remembers." },
  { id: -17, title: "Moonlight", year: 2016, rating: 7.7, genres: ["Drama"], runtime: 111, cast: ["Trevante Rhodes", "Mahershala Ali", "Naomie Harris"], overview: "Three chapters in one life, each asking the same question: who do you become when nobody shows you how?" },
  { id: -18, title: "La La Land", year: 2016, rating: 7.9, genres: ["Romance", "Drama", "Music"], runtime: 128, cast: ["Ryan Gosling", "Emma Stone", "John Legend"], overview: "An actress and a pianist fall in love with each other and with careers that keep asking them to choose." },
  { id: -19, title: "Prisoners", year: 2013, rating: 8.1, genres: ["Thriller", "Crime"], runtime: 153, cast: ["Hugh Jackman", "Jake Gyllenhaal", "Viola Davis"], overview: "Two families lose their daughters, and a father decides that patience is a luxury he cannot afford." },
  { id: -20, title: "The Prestige", year: 2006, rating: 8.5, genres: ["Thriller", "Drama"], runtime: 130, cast: ["Christian Bale", "Hugh Jackman", "Scarlett Johansson"], overview: "Two illusionists turn professional rivalry into a private war where the trick is always worth more than the person performing it." },
  { id: -21, title: "Oppenheimer", year: 2023, rating: 8.1, genres: ["Drama", "History"], runtime: 181, cast: ["Cillian Murphy", "Emily Blunt", "Robert Downey Jr."], overview: "A physicist leads a secret project to end a war and spends the rest of his life living inside the consequences." },
  { id: -22, title: "There Will Be Blood", year: 2007, rating: 8.2, genres: ["Drama", "Western"], runtime: 158, cast: ["Daniel Day-Lewis", "Paul Dano"], overview: "An oil prospector builds an empire from dust, extracting everything the land and the people around him will give." },
  { id: -23, title: "Spirited Away", year: 2001, rating: 8.6, genres: ["Animation", "Fantasy"], runtime: 125, cast: ["Rumi Hiiragi", "Miyu Irino"], overview: "A girl wanders into a world of spirits and must work to earn back her name, her parents and the way home." },
];

export const demoSeries: DemoItem[] = [
  { id: -101, title: "Breaking Bad", year: 2008, rating: 8.9, genres: ["Drama", "Crime"], seasons: 5, cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"], overview: "A chemistry teacher with nothing left to lose builds a second career, one careful decision at a time." },
  { id: -102, title: "Dark", year: 2017, rating: 8.4, genres: ["Mystery", "Science Fiction"], seasons: 3, cast: ["Louis Hofmann", "Lisa Vicari", "Oliver Masucci"], overview: "A missing child pulls four families into a small town's history, where the past keeps arriving on schedule." },
  { id: -103, title: "Severance", year: 2022, rating: 8.5, genres: ["Science Fiction", "Mystery"], seasons: 2, cast: ["Adam Scott", "Britt Lower", "Patricia Arquette"], overview: "Office workers split their memories between work and home, until one of them starts wondering what happens on the other side." },
  { id: -104, title: "The Bear", year: 2022, rating: 8.4, genres: ["Drama", "Comedy"], seasons: 3, cast: ["Jeremy Allen White", "Ayo Edebiri", "Ebon Moss-Bachrach"], overview: "A chef inherits a family sandwich shop and tries to run it like a kitchen that deserves a star." },
  { id: -105, title: "True Detective", year: 2014, rating: 8.6, genres: ["Crime", "Mystery"], seasons: 4, cast: ["Matthew McConaughey", "Woody Harrelson"], overview: "Two detectives tell the story of a case that took seventeen years to finish, and neither version is quite true." },
  { id: -106, title: "Chernobyl", year: 2019, rating: 8.7, genres: ["Drama", "History"], seasons: 1, cast: ["Jared Harris", "Stellan Skarsgård", "Emily Watson"], overview: "A reactor explodes and a system spends its remaining days deciding which version of the truth is affordable." },
  { id: -107, title: "Better Call Saul", year: 2015, rating: 8.7, genres: ["Drama", "Crime"], seasons: 6, cast: ["Bob Odenkirk", "Rhea Seehorn", "Jonathan Banks"], overview: "A small-time lawyer with a talent for shortcuts discovers how long a career can survive on charm and improvisation." },
  { id: -108, title: "Stranger Things", year: 2016, rating: 8.3, genres: ["Science Fiction", "Horror"], seasons: 4, cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"], overview: "A group of kids in a quiet town find a door to somewhere else, and something on the other side finds it back." },
  { id: -109, title: "The Leftovers", year: 2014, rating: 8.2, genres: ["Drama", "Fantasy"], seasons: 3, cast: ["Justin Theroux", "Carrie Coon", "Amy Brenneman"], overview: "After a sudden disappearance nobody can explain, the people who remain try to invent a reason to keep going." },
  { id: -110, title: "Fleabag", year: 2016, rating: 8.6, genres: ["Comedy", "Drama"], seasons: 2, cast: ["Phoebe Waller-Bridge", "Sian Clifford", "Andrew Scott"], overview: "A woman narrates her own disasters to the only person guaranteed to listen: whoever happens to be watching." },
  { id: -111, title: "Succession", year: 2018, rating: 8.6, genres: ["Drama"], seasons: 4, cast: ["Brian Cox", "Jeremy Strong", "Sarah Snook"], overview: "A media empire ages out of its founder, and his children compete to inherit something none of them can actually hold." },
  { id: -112, title: "The Last of Us", year: 2023, rating: 8.5, genres: ["Drama", "Thriller"], seasons: 2, cast: ["Pedro Pascal", "Bella Ramsey"], overview: "A smuggler escorts a teenage girl across a ruined country where the biggest danger is other survivors." },
  { id: -113, title: "Shogun", year: 2024, rating: 8.4, genres: ["Drama", "History"], seasons: 1, cast: ["Hiroyuki Sanada", "Cosmo Jarvis", "Anna Sawai"], overview: "A shipwrecked English sailor becomes a piece on a board he cannot read, in a country on the edge of civil war." },
  { id: -114, title: "Andor", year: 2022, rating: 8.2, genres: ["Science Fiction", "Drama"], seasons: 2, cast: ["Diego Luna", "Stellan Skarsgård", "Genevieve O'Reilly"], overview: "A thief becomes a courier becomes a problem for an empire that never imagined people this ordinary could organise." },
];


/* ------------------------------------------------------- Turkish catalogue */

/** Genre labels for the interface language, keyed by the English demo name. */
const GENRE_LABELS: Record<string, string> = {
  "Science Fiction": "Bilim Kurgu",
  Adventure: "Macera",
  Drama: "Dram",
  Thriller: "Gerilim",
  Action: "Aksiyon",
  Crime: "Suç",
  Mystery: "Gizem",
  Music: "Müzik",
  Comedy: "Komedi",
  History: "Tarih",
  Romance: "Romantik",
  Western: "Vestern",
  Animation: "Animasyon",
  Fantasy: "Fantastik",
  Horror: "Korku",
  Documentary: "Belgesel",
  Family: "Aile",
  War: "Savaş",
};

function genreLabel(name: string): string {
  return getLang() === "tr" ? GENRE_LABELS[name] ?? name : name;
}

function overviewOf(item: DemoItem): string {
  const translated = getLang() === "tr" ? DEMO_OVERVIEW_TR[item.id] : undefined;
  return translated || item.overview;
}

/** Turkish synopses, keyed by demo id (titles stay in their original language). */
const DEMO_OVERVIEW_TR: Record<number, string> = {
  [-1]: "Seçkin bir varis, evrenin en değerli maddesi etrafında siyasetin, kehanetin ve hayatta kalma çabasının çarpıştığı bir çöl dünyasına sürüklenir.",
  [-2]: "Bir dilbilimci, dilini öğrenmek zamanı algılayışını bile değiştirebilecek ziyaretçilerle iletişim kurmakla görevlendirilir.",
  [-3]: "Bir blade runner, toplumdan geriye kalanı ve kendi benlik duygusunu parçalayacak kadar derine gömülmüş bir sırrı ortaya çıkarır.",
  [-4]: "Dünya tükenirken eski bir pilot, geride bıraktığı insanlara bir gelecek bulmak için solucan deliğinden geçen bir göreve katılır.",
  [-5]: "Rüyalardan fikir çalan bir uzman son bir iş teklifi alır: bu kez fikri çalmak değil, yerleştirmek ve kalıcı kılmak.",
  [-6]: "Pelerinli genç bir dedektif, içten çürüyen bir şehirde bilmece izlerini takip eder.",
  [-7]: "Zorlukla geçinen bir aile kendini zenginlerin evine davet ettirir ve bu düzenin kimsenin hesaplamadığı bir bedeli olduğunu görür.",
  [-8]: "Genç bir davulcu, acımasızlığın tek dürüst teşvik olduğuna inanan bir hocanın elinde büyüklüğün peşinden koşar.",
  [-9]: "Bir savaş aracı isyanı ve tonlarca yakıtı taşırken çorak topraklarda tek bir uzun, gürültülü kaçış.",
  [-10]: "Bir çamaşırhane sahibi, yaşamadığı her hayatın ödünç alabileceği bir silah olduğunu keşfeder.",
  [-11]: "Bir konsiyerj ve lobi görevlisi; çalınmış bir tabloya, bir aile servetine ve koca bir dönemin sonuna bulaşır.",
  [-12]: "Serbest çalışan bir kameraman, kötü haber piyasasının en yakına gitmeye razı olanları ödüllendirdiğini keşfeder.",
  [-13]: "İdealist bir ajan, koruyacağına yemin ettiği kuralların öteki tarafında çalışan bir görev gücüne çekilir.",
  [-14]: "Bir dedektifle profesyonel bir hırsız, ikisine de asla tam siper vermeyen bir şehirde birbirinin etrafında döner.",
  [-15]: "Yurt odasında kurulan bir web sitesi; bir şirkete, bir davaya ve bir arkadaşı kaybetmenin çok pahalı bir yoluna dönüşür.",
  [-16]: "Bir yıl dönümünde kaybolan eş ve medyanın anlattığı hikâye, olaya karışanların hatırladığı hikâye değildir.",
  [-17]: "Tek bir hayatın üç bölümü; her biri aynı soruyu sorar: kimse sana yol göstermezken sen ne olursun?",
  [-18]: "Bir oyuncu ve bir piyanist hem birbirine hem de kendilerinden seçim yapmayı isteyen kariyerlerine âşık olur.",
  [-19]: "İki aile kızlarını kaybeder ve bir baba sabrın karşılayamayacağı bir lüks olduğuna karar verir.",
  [-20]: "İki illüzyonist, mesleki rekabeti numaranın her zaman onu yapan kişiden değerli olduğu özel bir savaşa çevirir.",
  [-21]: "Bir fizikçi bir savaşı bitirmek için gizli bir projeye öncülük eder ve hayatının kalanını sonuçların içinde geçirir.",
  [-22]: "Bir petrol arayıcısı tozdan bir imparatorluk kurar; toprağın ve çevresindeki insanların verebileceği her şeyi çekip alır.",
  [-23]: "Bir kız ruhlar dünyasına dalar ve adını, ailesini ve eve dönüş yolunu geri kazanmak için çalışmak zorundadır.",
  [-101]: "Kaybedecek hiçbir şeyi kalmayan bir kimya öğretmeni, dikkatli kararlarla ikinci bir kariyer kurar.",
  [-102]: "Kaybolan bir çocuk dört aileyi kasabanın tarihine çeker; geçmiş, randevusuna hep zamanında gelir.",
  [-103]: "Ofis çalışanları anılarını iş ve ev arasında böler; ta ki biri öteki tarafta ne olduğunu merak etmeye başlayana kadar.",
  [-104]: "Bir şef ailesinden kalan sandviç dükkânını devralır ve onu yıldızı hak eden bir mutfak gibi yönetmeye çalışır.",
  [-105]: "İki dedektif on yedi yılda sonuçlanan bir davayı anlatır ve iki anlatıdan hiçbiri tam olarak doğru değildir.",
  [-106]: "Bir reaktör patlar ve sistem geri kalan günlerini hangi gerçeğin karşılanabilir olduğuna karar vererek geçirir.",
  [-107]: "Kısayollara yetenekli küçük bir avukat, bir kariyerin çekicilik ve doğaçlamayla ne kadar yaşayabileceğini keşfeder.",
  [-108]: "Sakin bir kasabadaki bir grup çocuk başka bir yere açılan bir kapı bulur ve öteki taraftaki bir şey de onları bulur.",
  [-109]: "Kimsenin açıklayamadığı ani bir kayboluşun ardından geride kalanlar devam etmek için bir sebep uydurmaya çalışır.",
  [-110]: "Bir kadın kendi felaketlerini dinleyeceği garanti tek kişiye anlatır: o anda kim izliyorsa.",
  [-111]: "Bir medya imparatorluğu kurucusundan büyür ve çocukları hiçbirinin gerçekten tutamayacağı bir miras için yarışır.",
  [-112]: "Bir kaçakçı yıkılmış bir ülkeyi genç bir kızla geçer; en büyük tehlike diğer hayatta kalanlardır.",
  [-113]: "Kazaya uğrayan bir İngiliz denizci, iç savaşın eşiğindeki bir ülkede okuyamadığı bir tahtanın taşı olur.",
  [-114]: "Bir hırsız kurye olur, kurye de bu kadar sıradan insanların örgütlenebileceğini hiç düşünmemiş bir imparatorluk için soruna dönüşür.",
};

const all = [...demoMovies, ...demoSeries];
const typeOfItem = (item: DemoItem): MediaType => (item.id < -100 ? "tv" : "movie");
const byId = new Map<string, DemoItem>(all.map((item) => [`${typeOfItem(item)}:${item.id}`, item]));

const SEASON_EPISODE_TITLES = [
  "Long Way Down", "The Quiet Room", "Static", "What We Carried", "Parallel Lines",
  "The House on Ninth", "Low Tide", "A Better Version", "The Long Dark", "Everything After",
];

export function demoTitle(type: MediaType, id: number): Title | null {
  const item = byId.get(`${type}:${id}`);
  if (!item) return null;
  const isShow = type === "tv";
  const poster = artUrl({ title: item.title, year: item.year, kind: "poster", seed: Math.abs(id) });
  const backdrop = artUrl({ title: item.title, kind: "backdrop", seed: Math.abs(id) });
  return {
    id: item.id,
    type,
    title: item.title,
    overview: overviewOf(item),
    poster,
    backdrop,
    year: item.year,
    rating: item.rating,
    votes: Math.round((item.rating * 1370) % 9000) + 1200,
    genres: item.genres.map(genreLabel),
    runtime: item.runtime ?? null,
    seasons: item.seasons ?? null,
    status: t("meta.released"),
    tagline: "",
    cast: item.cast.map((name) => ({ name, role: "" })),
    trailerKey: null,
    externalIds: { imdb: null },
    demo: true,
    ...(isShow ? { seasonList: buildSeasons(item) } : {}),
    recommendations: [],
  };
}

function buildSeasons(show: DemoItem) {
  const count = show.seasons ?? 0;
  return Array.from({ length: count }, (_, i) => ({
    season: i + 1,
    name: t("watch.season", { number: i + 1 }),
    episodes: 8,
    year: show.year + i,
    poster: artUrl({
      title: `${show.title} S${i + 1}`,
      year: show.year + i,
      kind: "poster",
      seed: Math.abs(show.id) + (i + 1) * 17,
    }),
    overview: "",
  }));
}

export function demoSeason(type: MediaType, id: number, season: number): SeasonResponse | null {
  const show = byId.get(`${type}:${id}`);
  if (!show || !show.seasons || season < 1 || season > show.seasons) return null;
  return {
    season,
    episodes: Array.from({ length: 8 }, (_, i) => ({
      episode: i + 1,
      name: SEASON_EPISODE_TITLES[(i + season - 1) % SEASON_EPISODE_TITLES.length],
      overview: t("demo.episodeNote"),
      runtime: 46 + (i % 4) * 4,
      rating: 7.4 + ((i + season) % 9) / 10,
      still: artUrl({
        title: `${show.title} · S${season}E${i + 1}`,
        kind: "backdrop",
        seed: Math.abs(id) + season * 31 + i,
      }),
      airDate: `${show.year + season - 1}-0${(i % 9) + 1}-1${i % 9}`,
    })),
  };
}

export function demoList(
  kind: MediaType,
  { page = 1, genre = "", sort = "popularity", search: term = "" }: { page?: number; genre?: string; sort?: string; search?: string } = {},
): Page<Title> {
  let rows = kind === "tv" ? [...demoSeries] : [...demoMovies];
  if (term) {
    const q = term.toLowerCase();
    rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.genres.join(" ").toLowerCase().includes(q));
  }
  if (genre) rows = rows.filter((r) => r.genres.includes(genre));
  if (sort === "rating") rows.sort((a, b) => b.rating - a.rating);
  else if (sort === "newest") rows.sort((a, b) => b.year - a.year);
  else if (sort === "title") rows.sort((a, b) => a.title.localeCompare(b.title));
  else rows.sort((a, b) => b.rating * 10 + b.year - (a.rating * 10 + a.year));

  const perPage = 24;
  const total = rows.length;
  return {
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    results: rows
      .slice((page - 1) * perPage, page * perPage)
      .map((r) => demoTitle(typeOfItem(r), r.id))
      .filter((item): item is Title => Boolean(item)),
  };
}

export function demoGenres(): { id: string; name: string }[] {
  const names = [...new Set(all.flatMap((item) => item.genres))].sort();
  // The id stays the English key (the value demoList filters on); only the
  // label the user reads is translated.
  return names.map((name) => ({ id: name, name: genreLabel(name) }));
}

export function demoHome(): { trending: Title[]; rows: { key: string; title: string; items: Title[]; wide?: boolean }[] } {
  const movie = (list: DemoItem[]) =>
    list.map((r) => demoTitle("movie", r.id)).filter((item): item is Title => Boolean(item));
  const tv = (list: DemoItem[]) => list.map((r) => demoTitle("tv", r.id)).filter((item): item is Title => Boolean(item));
  return {
    trending: [...movie(demoMovies.slice(0, 8)), ...tv(demoSeries.slice(0, 6))],
    rows: [
      { key: "popular-movies", title: t("home.row.popularFilms"), items: movie([...demoMovies].sort((a, b) => b.rating - a.rating)) },
      { key: "popular-tv", title: t("home.row.worthStayingUp"), items: tv(demoSeries) },
      { key: "new", title: t("home.row.newNoteworthy"), items: movie([...demoMovies].sort((a, b) => b.year - a.year)) },
    ],
  };
}

/** "More like this" for demo titles: same-genre neighbours, then the other medium. */
export function demoRecommendations(type: MediaType, id: number): Title[] {
  const source = demoTitle(type, id);
  if (!source) return [];
  const same = demoList(type, {}).results.filter((item) => item.id !== id);
  const other = demoList(type === "tv" ? "movie" : "tv", {}).results;
  return [...same, ...other].filter((item) => item.genres.some((g) => source.genres.includes(g))).slice(0, 12);
}
