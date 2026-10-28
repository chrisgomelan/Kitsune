"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import {
  CalendarIcon,
  ChevronDownIcon,
  CloseIcon,
  FilmIcon,
  FlameIcon,
  SearchIcon,
  SlidersIcon,
  StarIcon,
} from "@/components/Icons";
import type { AnimeBase } from "@/types/anime";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Mystery",
  "Sports",
  "Horror",
  "Suspense",
];

const YEARS = [
  { value: "All", label: "All Years" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2010s", label: "2010s (2010–2019)" },
  { value: "2000s", label: "2000s (2000–2009)" },
  { value: "classic", label: "Classics (Pre-2000)" },
];

const RATINGS = [
  { value: 0, label: "Any Rating" },
  { value: 8, label: "★ 8.0+ Masterpiece" },
  { value: 7, label: "★ 7.0+ Great" },
  { value: 6, label: "★ 6.0+ Good" },
];

const SORTS = [
  { value: "trending", label: "Popular / Ranked" },
  { value: "score", label: "Highest Score" },
  { value: "newest", label: "Newest Year" },
  { value: "oldest", label: "Oldest Year" },
  { value: "title", label: "Title (A – Z)" },
];

function getAnimeYear(anime: AnimeBase): number | null {
  if (anime.year && !isNaN(anime.year)) return anime.year;
  if (anime.aired?.from) {
    const y = parseInt(anime.aired.from.slice(0, 4), 10);
    if (!isNaN(y)) return y;
  }
  return null;
}

function matchesAnimeYear(anime: AnimeBase, yearFilter: string): boolean {
  if (!yearFilter || yearFilter === "All") return true;
  const y = getAnimeYear(anime);
  if (!y) return false;

  if (/^\d{4}$/.test(yearFilter)) {
    return y === parseInt(yearFilter, 10);
  }
  if (yearFilter === "2020s") return y >= 2020 && y <= 2029;
  if (yearFilter === "2010s") return y >= 2010 && y <= 2019;
  if (yearFilter === "2000s") return y >= 2000 && y <= 2009;
  if (yearFilter === "classic") return y < 2000;
  return true;
}

interface HomeGenreSectionProps {
  initialTopAnime: AnimeBase[];
  initialSeasonalAnime: AnimeBase[];
}

export default function HomeGenreSection({
  initialTopAnime,
  initialSeasonalAnime,
}: HomeGenreSectionProps) {
  // Primary Filter State
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedSort, setSelectedSort] = useState<string>("trending");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Base raw anime pool for current genre
  const [rawAnime, setRawAnime] = useState<AnimeBase[]>(() => {
    const seen = new Set<number>();
    const list: AnimeBase[] = [];
    for (const a of [...initialTopAnime, ...initialSeasonalAnime]) {
      if (!seen.has(a.mal_id)) {
        seen.add(a.mal_id);
        list.push(a);
      }
    }
    return list;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const cacheRef = useRef<Map<string, AnimeBase[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    cacheRef.current.set("All", rawAnime);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectGenre = async (genre: string) => {
    setSelectedGenre(genre);

    if (genre === "All") {
      const cachedAll = cacheRef.current.get("All") || rawAnime;
      setRawAnime(cachedAll);
      setIsLoading(false);
      return;
    }

    const cached = cacheRef.current.get(genre);
    if (cached) {
      setRawAnime(cached);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/genre?name=${encodeURIComponent(genre)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        const results: AnimeBase[] = data.results ?? [];
        cacheRef.current.set(genre, results);
        setRawAnime(results);
      } else {
        setRawAnime([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setRawAnime([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedGenre("All");
    setSelectedYear("All");
    setMinRating(0);
    setSelectedSort("trending");
    setSearchFilter("");
    handleSelectGenre("All");
  };

  const hasActiveFilters =
    selectedGenre !== "All" ||
    selectedYear !== "All" ||
    minRating > 0 ||
    selectedSort !== "trending" ||
    searchFilter.trim() !== "";

  // Filter & Sort Pipeline
  const filteredAnime = useMemo(() => {
    let result = [...rawAnime];

    // Filter by Year
    if (selectedYear !== "All") {
      result = result.filter((a) => matchesAnimeYear(a, selectedYear));
    }

    // Filter by Minimum Rating
    if (minRating > 0) {
      result = result.filter((a) => (a.score ?? 0) >= minRating);
    }

    // Filter by Search Query
    const q = searchFilter.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.title_english ?? "").toLowerCase().includes(q) ||
          a.genres.some((g) => g.name.toLowerCase().includes(q))
      );
    }

    // Sort Pipeline
    if (selectedSort === "score") {
      result.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (selectedSort === "newest") {
      result.sort((a, b) => (getAnimeYear(b) ?? 0) - (getAnimeYear(a) ?? 0));
    } else if (selectedSort === "oldest") {
      result.sort((a, b) => (getAnimeYear(a) ?? 9999) - (getAnimeYear(b) ?? 9999));
    } else if (selectedSort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (selectedSort === "trending") {
      result.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
    }

    return result;
  }, [rawAnime, selectedYear, minRating, searchFilter, selectedSort]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Filter Hub Card */}
      <section
        aria-label="Anime Filters and Discovery"
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900/60 p-3.5 sm:p-6 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl space-y-4"
      >
        {/* Header row with Title & Quick Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30">
              <SlidersIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Discover & Filter Anime
                <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              </h2>
              <p className="text-[11px] sm:text-xs text-white/50">
                Filter by genre, release year, score, or sort by preference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-white/70 ring-1 ring-white/10">
              {filteredAnime.length} {filteredAnime.length === 1 ? "anime" : "anime"}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-500/20 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-violet-300 ring-1 ring-violet-500/30 hover:bg-violet-600 hover:text-white transition active:scale-95 cursor-pointer"
              >
                <CloseIcon className="size-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Controls Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {/* Genre Dropdown */}
          <div className="relative">
            <label htmlFor="filter-genre" className="sr-only">
              Filter by Genre
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/80">
                <FilmIcon className="size-3.5" />
              </span>
              <select
                id="filter-genre"
                value={selectedGenre}
                onChange={(e) => handleSelectGenre(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl bg-white/5 pl-8 pr-8 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-white">
                    {g === "All" ? "All Genres" : g}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownIcon className="size-3" />
              </span>
            </div>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <label htmlFor="filter-year" className="sr-only">
              Filter by Year
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/80">
                <CalendarIcon className="size-3.5" />
              </span>
              <select
                id="filter-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl bg-white/5 pl-8 pr-8 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value} className="bg-zinc-900 text-white">
                    {y.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownIcon className="size-3" />
              </span>
            </div>
          </div>

          {/* Min Rating Dropdown */}
          <div className="relative">
            <label htmlFor="filter-rating" className="sr-only">
              Filter by Minimum Rating
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
                <StarIcon className="size-3.5" />
              </span>
              <select
                id="filter-rating"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-10 w-full appearance-none rounded-xl bg-white/5 pl-8 pr-8 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
              >
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-zinc-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownIcon className="size-3" />
              </span>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <label htmlFor="filter-sort" className="sr-only">
              Sort Anime
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/80">
                <FlameIcon className="size-3.5" />
              </span>
              <select
                id="filter-sort"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl bg-white/5 pl-8 pr-8 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-zinc-900 text-white">
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownIcon className="size-3" />
              </span>
            </div>
          </div>

          {/* Search Filter Input (Full width on mobile, 5th col on desktop) */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 relative">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                <SearchIcon className="size-3.5" />
              </span>
              <input
                type="text"
                placeholder="Filter anime titles..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-10 w-full rounded-xl bg-white/5 pl-8 pr-8 text-xs font-semibold text-white placeholder-white/35 ring-1 ring-white/10 transition hover:bg-white/10 focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                  title="Clear filter text"
                >
                  <CloseIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Genre Pills (Instant 1-tap switching) */}
        <div className="pt-1">
          <div className="-mx-3.5 px-3.5 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-scroll">
            {GENRES.map((g) => {
              const isActive = selectedGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectGenre(g)}
                  aria-pressed={isActive}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-950/60 ring-1 ring-violet-400"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
                  }`}
                >
                  {g === "All" ? "All Genres" : g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Chips Row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] border-t border-white/5">
            <span className="font-semibold text-white/40 mr-1">Active Filters:</span>

            {selectedGenre !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 font-bold text-violet-300 ring-1 ring-violet-500/30">
                Genre: {selectedGenre}
                <button
                  type="button"
                  onClick={() => handleSelectGenre("All")}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove genre filter"
                >
                  <CloseIcon className="size-2.5" />
                </button>
              </span>
            )}

            {selectedYear !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 font-bold text-violet-300 ring-1 ring-violet-500/30">
                Year: {YEARS.find((y) => y.value === selectedYear)?.label || selectedYear}
                <button
                  type="button"
                  onClick={() => setSelectedYear("All")}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove year filter"
                >
                  <CloseIcon className="size-2.5" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 font-bold text-violet-300 ring-1 ring-violet-500/30">
                Score: {minRating}.0+
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove rating filter"
                >
                  <CloseIcon className="size-2.5" />
                </button>
              </span>
            )}

            {selectedSort !== "trending" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/80 ring-1 ring-white/15">
                Sort: {SORTS.find((s) => s.value === selectedSort)?.label}
                <button
                  type="button"
                  onClick={() => setSelectedSort("trending")}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Reset sort"
                >
                  <CloseIcon className="size-2.5" />
                </button>
              </span>
            )}

            {searchFilter.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/80 ring-1 ring-white/15">
                Keyword: &ldquo;{searchFilter}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Clear keyword"
                >
                  <CloseIcon className="size-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Anime Grid & States */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[2/3] w-full animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
            />
          ))}
        </div>
      ) : filteredAnime.length === 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-dashed border-white/10 py-16 text-center px-4 space-y-3">
          <p className="text-base font-bold text-white">No anime match your current criteria</p>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Try adjusting your genre, release year, minimum score, or clear the search query to see more titles.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 active:scale-95 cursor-pointer shadow-lg shadow-violet-950/50"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <section aria-label="Filtered Anime Results" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredAnime.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
