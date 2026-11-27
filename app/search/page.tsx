import type { Metadata } from "next";
import Link from "next/link";
import CatalogGrid from "@/components/CatalogGrid";
import CategorySelect from "@/components/CategorySelect";
import { SpeechBalloon } from "@/components/MangaSpeechBubbles";
import {
  getPopularAnime,
  getTopAnime,
  getSeasonalAnime,
  getAnimeByGenre,
  searchAnime,
} from "@/lib/jikan";
import type { AnimeBase } from "@/types/anime";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    category?: string;
    type?: string;
  }>;
}

const CATEGORY_TABS = [
  { label: "Popular", type: "popular" },
  { label: "Top Rated", type: "top" },
  { label: "Seasonal", type: "seasonal" },
  { label: "Action", genre: "Action" },
  { label: "Adventure", genre: "Adventure" },
  { label: "Comedy", genre: "Comedy" },
  { label: "Drama", genre: "Drama" },
  { label: "Fantasy", genre: "Fantasy" },
  { label: "Mystery", genre: "Mystery" },
  { label: "Romance", genre: "Romance" },
  { label: "Sci-Fi", genre: "Sci-Fi" },
  { label: "Slice of Life", genre: "Slice of Life" },
  { label: "Sports", genre: "Sports" },
  { label: "Supernatural", genre: "Supernatural" },
];

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q, genre, category, type } = await searchParams;
  const targetGenre = genre || category;

  if (targetGenre) {
    return {
      title: `${targetGenre} Anime Catalog - Kitsune`,
      description: `Browse top ${targetGenre} anime on Kitsune.`,
    };
  }

  if (type === "top") {
    return {
      title: "Top Rated Anime - Kitsune",
      description: "Highest scoring anime of all time.",
    };
  }

  if (type === "seasonal") {
    return {
      title: "Current Season Anime - Kitsune",
      description: "Trending anime airing this season.",
    };
  }

  if (q && q.trim().toLowerCase() !== "popular" && q.trim().toLowerCase() !== "all") {
    return {
      title: `Search: ${q} - Kitsune`,
      description: `Search results for "${q}" on Kitsune.`,
    };
  }

  return {
    title: "Anime Catalog - Kitsune",
    description: "Explore popular anime, top rankings, and releases by genre.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQ = (params.q ?? "").trim();
  const rawGenre = (params.genre ?? params.category ?? "").trim();
  const rawType = (params.type ?? "").trim().toLowerCase();

  // Check for restricted / adult searches
  const adultTerms = ["hentai", "erotica", "porn", "xxx", "r18", "nsfw"];
  const isAdultQuery =
    adultTerms.some((t) => rawQ.toLowerCase().includes(t)) ||
    rawGenre.toLowerCase() === "hentai" ||
    rawGenre.toLowerCase() === "erotica";

  if (isAdultQuery) {
    return (
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-12 text-center space-y-4">
        <div className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-8 max-w-md mx-auto shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
          <h2 className="font-manga-title text-xl font-black text-black dark:text-white uppercase">
            Content Restricted
          </h2>
          <p className="mt-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Adult and explicit 18+ content is restricted on Kitsune.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-block px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normalize user intent: if query is "popular", "top", "all", or a genre name, treat as browsing
  let activeGenre = rawGenre;
  let activeType = rawType;
  let activeQuery = rawQ;

  const qLower = rawQ.toLowerCase();
  const matchedGenre = CATEGORY_TABS.find(
    (tab) => tab.genre && tab.genre.toLowerCase() === qLower
  );

  if (matchedGenre && matchedGenre.genre) {
    activeGenre = matchedGenre.genre;
    activeQuery = "";
  } else if (qLower === "popular" || qLower === "all" || qLower === "trending") {
    activeType = "popular";
    activeQuery = "";
  } else if (qLower === "top" || qLower === "top rated") {
    activeType = "top";
    activeQuery = "";
  } else if (qLower === "seasonal") {
    activeType = "seasonal";
    activeQuery = "";
  }

  // Fetch results based on active filter
  let results: AnimeBase[] = [];
  let headerTag = "CATALOG";
  let pageTitle = "Popular Anime Catalog";
  let pageSubtitle = "The most watched and trending anime across the catalog";

  if (activeQuery) {
    headerTag = "SEARCH RESULTS";
    pageTitle = `Results for "${activeQuery}"`;
    results = await searchAnime(activeQuery, 24);
    pageSubtitle = `Found ${results.length} matches`;
  } else if (activeGenre) {
    headerTag = "GENRE CATALOG";
    pageTitle = `${activeGenre} Anime`;
    pageSubtitle = `Top community favorites and popular ${activeGenre} releases`;
    results = await getAnimeByGenre(activeGenre, 24);
  } else if (activeType === "top") {
    headerTag = "ALL-TIME RANKINGS";
    pageTitle = "Top Rated Anime";
    pageSubtitle = "Highest community scored anime of all time";
    results = await getTopAnime(24);
  } else if (activeType === "seasonal") {
    headerTag = "CURRENT RELEASES";
    pageTitle = "Seasonal Anime";
    pageSubtitle = "Anime currently airing right now";
    results = await getSeasonalAnime(24);
  } else {
    // Default: Popular Catalog
    headerTag = "FULL CATALOG";
    pageTitle = "Popular Anime Catalog";
    pageSubtitle = "The most watched and celebrated anime titles";
    results = await getPopularAnime(24);
    activeType = "popular";
  }

  // Determine active tab for styling
  const isTabActive = (tab: (typeof CATEGORY_TABS)[number]) => {
    if (activeQuery) return false;
    if (tab.genre) {
      return activeGenre.toLowerCase() === tab.genre.toLowerCase();
    }
    if (tab.type) {
      return activeType === tab.type;
    }
    return false;
  };

  const categoryOptions = CATEGORY_TABS.map((tab) => {
    const active = isTabActive(tab);
    const href = tab.genre
      ? `/search?genre=${encodeURIComponent(tab.genre)}`
      : `/search?type=${tab.type}`;
    return {
      label: tab.label,
      href,
      active,
    };
  });

  const activeOption = categoryOptions.find((opt) => opt.active) ?? categoryOptions[0];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER BANNER WITH COMIC SPEECH ACCENT
      ────────────────────────────────────────────────────────────── */}
      <header className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-6 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black mb-1 border border-black dark:border-white">
              {headerTag}
            </span>
            <h1 className="font-manga-title text-xl sm:text-3xl font-black text-black dark:text-white tracking-wide uppercase">
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
              {pageSubtitle} • Showing {results.length} titles
            </p>
          </div>

          <div className="hidden sm:block shrink-0">
            <SpeechBalloon
              text={activeQuery ? "SEARCH!" : "CHECK THIS OUT!"}
              tailPosition="bottom-left"
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CATEGORY NAVIGATION: DROPDOWN ON MOBILE, PILLS ON DESKTOP
        ────────────────────────────────────────────────────────────── */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t-2 border-dashed border-gray-300 dark:border-zinc-700">
          {/* Mobile Dropdown Selector */}
          <CategorySelect options={categoryOptions} activeHref={activeOption.href} />

          {/* Desktop Category Pills */}
          <div className="hidden sm:flex sm:flex-wrap items-center gap-1.5">
            {categoryOptions.map((opt) => (
              <Link
                key={opt.label}
                href={opt.href}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition whitespace-nowrap min-h-[36px] flex items-center justify-center shrink-0 active:translate-x-0.5 active:translate-y-0.5 ${
                  opt.active
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa]"
                    : "border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          RESULTS GRID OR EMPTY STATE
      ────────────────────────────────────────────────────────────── */}
      {results.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-10 sm:p-14 text-center shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] space-y-3">
          <p className="font-manga-title text-lg font-bold text-black dark:text-white uppercase">
            No Titles Found
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn&apos;t find matching anime. Try exploring our popular catalog or selecting another category above.
          </p>
          <div className="pt-2">
            <Link
              href="/search?type=popular"
              className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Back to Popular Anime
            </Link>
          </div>
        </div>
      ) : (
        <CatalogGrid
          initialAnime={results}
          type={activeType}
          genre={activeGenre}
          q={activeQuery}
        />
      )}
    </div>
  );
}
