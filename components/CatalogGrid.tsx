"use client";

import React, { useEffect, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import { ChevronDownIcon } from "@/components/Icons";
import type { AnimeBase } from "@/types/anime";

interface CatalogGridProps {
  initialAnime: AnimeBase[];
  type?: string;
  genre?: string;
  q?: string;
}

export default function CatalogGrid({
  initialAnime,
  type,
  genre,
  q,
}: CatalogGridProps) {
  const [items, setItems] = useState<AnimeBase[]>(initialAnime);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialAnime.length >= 24);

  // Sync state whenever search query, genre, type, or initial results change
  useEffect(() => {
    setItems(initialAnime);
    setPage(1);
    setIsLoading(false);
    setHasMore(initialAnime.length >= 24);
  }, [initialAnime, q, genre, type]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (genre) params.set("genre", genre);
      if (q) params.set("q", q);
      params.set("page", String(nextPage));
      params.set("limit", "24");

      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newResults: AnimeBase[] = data.results ?? [];

        if (newResults.length === 0) {
          setHasMore(false);
        } else {
          // Avoid duplicate entries
          setItems((prev) => {
            const existingIds = new Set(prev.map((a) => a.mal_id));
            const filteredNew = newResults.filter((a) => !existingIds.has(a.mal_id));
            return [...prev, ...filteredNew];
          });
          setPage(nextPage);
          if (newResults.length < 24) {
            setHasMore(false);
          }
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more anime:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Anime Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((anime) => (
          <AnimeCard key={`${anime.mal_id}-${anime.title}`} anime={anime} />
        ))}
      </div>

      {/* Interactive Load More Action */}
      <div className="text-center pt-2 pb-6 border-t-2 border-dashed border-gray-300 dark:border-zinc-700">
        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 min-h-[42px] cursor-pointer disabled:opacity-60"
          >
            <span>{isLoading ? "Loading anime..." : "Load More Anime"}</span>
            <ChevronDownIcon className={`size-4 ${isLoading ? "animate-bounce" : ""}`} />
          </button>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            You have reached the end of the catalog
          </p>
        )}
      </div>
    </div>
  );
}
