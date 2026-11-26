"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, CloseIcon, SearchIcon, StarIcon } from "@/components/Icons";
import type { AnimeBase } from "@/types/anime";

interface LiveSearchProps {
  variant?: "desktop" | "mobile";
  onSelect?: () => void;
  autoFocus?: boolean;
}

export default function LiveSearch({
  variant = "desktop",
  onSelect,
  autoFocus = false,
}: LiveSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, AnimeBase[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced AJAX search effect
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    // Check memory cache first
    const cached = cacheRef.current.get(trimmed.toLowerCase());
    if (cached) {
      setResults(cached);
      setIsLoading(false);
      setHasSearched(true);
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const items: AnimeBase[] = data.results ?? [];

        // Save to cache
        cacheRef.current.set(trimmed.toLowerCase(), items);
        setResults(items);
        setHasSearched(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("AJAX Search Error:", err);
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    onSelect?.();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectAnime = (animeId: number) => {
    setIsOpen(false);
    onSelect?.();
    router.push(`/anime/${animeId}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const isMobile = variant === "mobile";

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? "w-full" : "w-48 md:w-56 lg:w-64"}`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <label htmlFor={`live-search-${variant}`} className="sr-only">
          Search anime
        </label>
        <div className="relative w-full">
          <input
            ref={inputRef}
            id={`live-search-${variant}`}
            type="text"
            inputMode="search"
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="Search anime..."
            autoComplete="off"
            className={`w-full bg-white dark:bg-[#111215] text-xs font-bold text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-2 border-black dark:border-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] focus:outline-none focus:shadow-[3px_3px_0px_#000000] dark:focus:shadow-[3px_3px_0px_#ffffff] transition-all ${
              isMobile
                ? "h-10 pl-3.5 pr-10 text-sm"
                : "h-9 pl-3 pr-8 focus:w-64 lg:focus:w-72"
            }`}
          />

          {/* Right indicator: spinner or clear button */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-black dark:text-white hover:opacity-70 transition"
                aria-label="Clear search input"
              >
                <CloseIcon className="size-3" />
              </button>
            ) : (
              <SearchIcon className="size-3.5 text-black dark:text-white pointer-events-none" />
            )}
          </div>
        </div>
      </form>

      {/* Manga Live Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1 overflow-hidden bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] animate-in fade-in duration-100 ${
            isMobile ? "w-full" : "min-w-[320px] max-w-[380px]"
          }`}
        >
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto divide-y-2 divide-black/10 dark:divide-white/10 py-1">
              <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800">
                Matches
              </div>
              {results.map((anime) => {
                const title = anime.title_english ?? anime.title;
                const poster = anime.images.jpg.image_url;

                return (
                  <button
                    key={anime.mal_id}
                    type="button"
                    onClick={() => handleSelectAnime(anime.mal_id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden border border-black dark:border-white bg-gray-100 dark:bg-zinc-800">
                      {poster ? (
                        <Image
                          src={poster}
                          alt={title}
                          fill
                          sizes="36px"
                          className="object-cover manga-grayscale-img"
                        />
                      ) : null}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-xs font-bold text-black dark:text-white">
                        {title}
                      </h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                        {anime.type && <span className="font-semibold">{anime.type}</span>}
                        {anime.year && <span>• {anime.year}</span>}
                        {anime.episodes && <span>• {anime.episodes} eps</span>}
                      </div>
                    </div>

                    {/* Score */}
                    {anime.score && (
                      <div className="flex items-center gap-1 border border-black dark:border-white bg-white dark:bg-black px-1.5 py-0.5 text-[10px] font-bold text-black dark:text-white shrink-0">
                        <StarIcon className="size-2.5 fill-black dark:fill-amber-400 text-black dark:text-amber-400" />
                        <span>{anime.score.toFixed(1)}</span>
                      </div>
                    )}
                  </button>
                );
              })}

              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setIsOpen(false);
                  onSelect?.();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white bg-gray-50 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition border-t-2 border-black dark:border-white"
              >
                <span>View all results for &quot;{query}&quot;</span>
                <ChevronRightIcon className="size-3.5" />
              </Link>
            </div>
          ) : hasSearched && !isLoading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-bold text-black">
                No anime found for &quot;{query}&quot;
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 text-xs font-bold text-black underline hover:text-gray-600"
              >
                Press Enter to search anyway
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
