"use client";

import { useRef, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import { SparklesIcon, TrophyIcon } from "@/components/Icons";
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
];

interface HomeGenreSectionProps {
  initialTopAnime: AnimeBase[];
  initialSeasonalAnime: AnimeBase[];
}

export default function HomeGenreSection({
  initialTopAnime,
  initialSeasonalAnime,
}: HomeGenreSectionProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [genreAnime, setGenreAnime] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Map<string, AnimeBase[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSelectGenre = async (genre: string) => {
    setSelectedGenre(genre);

    if (genre === "All") {
      setGenreAnime([]);
      setIsLoading(false);
      return;
    }

    // Check client cache
    const cached = cacheRef.current.get(genre);
    if (cached) {
      setGenreAnime(cached);
      setIsLoading(false);
      return;
    }

    // Cancel in-flight request if user rapidly clicked another genre
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
        setGenreAnime(results);
      } else {
        setGenreAnime([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setGenreAnime([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Category / Genre Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-white/60">
          <span>Categories & Genres</span>
          {selectedGenre !== "All" && (
            <button
              type="button"
              onClick={() => handleSelectGenre("All")}
              className="text-violet-400 hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Scrollable genre pills container */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {GENRES.map((genre) => {
            const isActive = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => handleSelectGenre(genre)}
                aria-pressed={isActive}
                className={`h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/60 ring-1 ring-violet-400 scale-[1.02]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Rendering: Genre Mode vs Default "All" Mode */}
      {selectedGenre === "All" ? (
        <>
          {/* Top Anime Section */}
          <section aria-labelledby="top-anime-heading">
            <div className="mb-3.5 flex items-center gap-2">
              <TrophyIcon className="size-5 text-amber-400" />
              <h2 id="top-anime-heading" className="text-lg sm:text-xl font-bold text-white">
                Top Anime
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {initialTopAnime.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} />
              ))}
            </div>
          </section>

          {/* Airing This Season Section */}
          <section aria-labelledby="seasonal-heading">
            <div className="mb-3.5 flex items-center gap-2">
              <SparklesIcon className="size-5 text-violet-400" />
              <h2 id="seasonal-heading" className="text-lg sm:text-xl font-bold text-white">
                Airing This Season
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {initialSeasonalAnime.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} />
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Specific Genre View */
        <section aria-labelledby="genre-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
              <h2 id="genre-heading" className="text-lg sm:text-xl font-bold text-white">
                {selectedGenre} Anime
              </h2>
            </div>
            {!isLoading && (
              <span className="text-xs font-semibold text-white/40">
                {genreAnime.length} {genreAnime.length === 1 ? "title" : "titles"}
              </span>
            )}
          </div>

          {isLoading ? (
            /* Shimmer Skeleton Grid */
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[2/3] w-full animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
                />
              ))}
            </div>
          ) : genreAnime.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-sm text-white/50">
                No anime found in category &quot;{selectedGenre}&quot;.
              </p>
              <button
                type="button"
                onClick={() => handleSelectGenre("All")}
                className="mt-3 text-xs font-semibold text-violet-400 hover:underline"
              >
                Back to All Categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {genreAnime.map((anime) => (
                <AnimeCard key={anime.mal_id} anime={anime} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
