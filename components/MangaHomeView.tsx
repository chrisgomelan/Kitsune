"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import MangaMascot from "@/components/MangaMascot";
import {
  ComicSpeedLines,
  JaggedShoutBubble,
  SpeechBalloon,
} from "@/components/MangaSpeechBubbles";
import { ChevronDownIcon, StarIcon } from "@/components/Icons";
import type { AnimeBase } from "@/types/anime";

interface MangaHomeViewProps {
  topAnime: AnimeBase[];
  seasonalAnime: AnimeBase[];
}

const GENRE_FILTERS = [
  "All",
  "Action",
  "Comedy",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Mystery",
];

// Friendly non-technical updates
const SAMPLE_UPDATES = [
  { id: 1, title: "Frieren: Beyond Journey's End", tag: "Episode 28 added", time: "2 hours ago" },
  { id: 2, title: "Jujutsu Kaisen Season 2", tag: "English Dub available", time: "5 hours ago" },
  { id: 3, title: "Delicious in Dungeon", tag: "Season 1 completed", time: "1 day ago" },
  { id: 4, title: "Solo Leveling", tag: "Episode 12 added", time: "2 days ago" },
  { id: 5, title: "The Dangers in My Heart", tag: "New episode drop", time: "3 days ago" },
];

const COMMUNITY_TOPICS = [
  { id: 1, title: "Our cozy team is looking for new editors!", author: "Okami Team", time: "15 mins ago" },
  { id: 2, title: "Top 10 heartwarming anime to watch this weekend", author: "Simbiant", time: "40 mins ago" },
  { id: 3, title: "Which seasonal show has surprised you the most?", author: "Daniel_Z", time: "2 hours ago" },
  { id: 4, title: "Classic anime adaptations you must check out", author: "Noriel", time: "Yesterday" },
];

export default function MangaHomeView({
  topAnime,
  seasonalAnime,
}: MangaHomeViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [genreAnime, setGenreAnime] = useState<Record<string, AnimeBase[]>>({});
  const [isLoadingGenre, setIsLoadingGenre] = useState<boolean>(false);

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setVisibleCount(12);

    if (genre === "All") return;
    if (genreAnime[genre]) return;

    setIsLoadingGenre(true);
    try {
      const res = await fetch(`/api/genre?name=${encodeURIComponent(genre)}`);
      if (res.ok) {
        const data = await res.json();
        const results: AnimeBase[] = data.results ?? [];
        setGenreAnime((prev) => ({ ...prev, [genre]: results }));
      }
    } catch (err) {
      console.warn("Failed to fetch genre:", err);
    } finally {
      setIsLoadingGenre(false);
    }
  };

  // Spotlight anime
  const spotlight = topAnime[0] ?? seasonalAnime[0];
  const spotlightTitle = spotlight?.title_english ?? spotlight?.title ?? "Frieren: Beyond Journey's End";
  const spotlightPoster = spotlight?.images?.jpg?.large_image_url ?? spotlight?.images?.jpg?.image_url;

  // Mini updates strip (3 items)
  const miniUpdates = topAnime.slice(1, 4);

  // Resolved items for bottom shelf
  const currentShelfAnime =
    selectedGenre === "All"
      ? seasonalAnime
      : genreAnime[selectedGenre] && genreAnime[selectedGenre].length > 0
      ? genreAnime[selectedGenre]
      : seasonalAnime.filter((item) =>
          item.genres?.some((g) => g.name.toLowerCase() === selectedGenre.toLowerCase())
        );

  const displayedAnime = currentShelfAnime.slice(0, visibleCount);
  const hasMore = visibleCount < currentShelfAnime.length;

  // Top weekly ranks
  const leaderboard = topAnime.slice(0, 7);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

      {/* ─────────────────────────────────────────────────────────────
          TOP ROW: MINI UPDATES STRIP & WELCOME BANNER PANEL
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {/* Left mini strip ("OTHER UPDATES") */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] h-full flex flex-col justify-between">
            {/* Header tag */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-black dark:border-white">
              <span className="font-manga-title text-xs sm:text-sm font-bold tracking-wider text-black dark:text-white">
                OTHER UPDATES
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Fresh Picks
              </span>
            </div>

            {/* 3 mini thumbnails row */}
            <div className="grid grid-cols-3 gap-2">
              {miniUpdates.map((item) => {
                const title = item.title_english ?? item.title;
                return (
                  <Link
                    key={item.mal_id}
                    href={`/anime/${item.mal_id}`}
                    className="group relative flex flex-col overflow-hidden border-1.5 border-black dark:border-white/80 bg-gray-100 dark:bg-zinc-800 hover:shadow-[2px_2px_0px_#000000] dark:hover:shadow-[2px_2px_0px_#ffffff] transition"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={item.images.jpg.image_url}
                        alt={title}
                        fill
                        className="object-cover manga-grayscale-img group-hover:scale-105 transition-transform"
                        sizes="(max-width: 640px) 30vw, 120px"
                      />
                    </div>
                    <div className="p-1 bg-white dark:bg-[#1a1b20] text-center">
                      <p className="line-clamp-1 text-[10px] font-bold text-black dark:text-white group-hover:underline">
                        {title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center/Right Welcome Banner */}
        <div className="lg:col-span-8">
          <div className="relative h-full min-h-[100px] sm:min-h-[110px] bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-5 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] flex flex-col justify-center items-center text-center overflow-hidden">
            {/* Screentone background pattern */}
            <div className="absolute inset-0 screentone-dots-subtle opacity-60 pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block px-2.5 py-0.5 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-1">
                WELCOME
              </span>
              <h2 className="font-manga-title text-lg sm:text-2xl md:text-3xl font-black tracking-wide text-black dark:text-white uppercase">
                WELCOME TO KITSUNE
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
                Track what you watch, explore new seasonal releases, and save your progress effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN MIDDLE SECTION (3-COLUMN LAYOUT)
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
        
        {/* ── LEFT TALL PANEL: SPOTLIGHT ANIME ── */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] overflow-hidden">
            {/* Poster container - responsive aspect ratio */}
            <div className="relative aspect-[4/3] sm:aspect-[3/4] w-full overflow-hidden bg-gray-200 dark:bg-zinc-800 border-b-2 border-black dark:border-white">
              {spotlightPoster && (
                <Image
                  src={spotlightPoster}
                  alt={spotlightTitle}
                  fill
                  priority
                  className="object-cover manga-grayscale-img"
                  sizes="(max-width: 1024px) 100vw, 380px"
                />
              )}

              {/* Jagged explosion shout bubble popping over bottom corner */}
              <div className="absolute -bottom-2.5 left-2 sm:-left-1 z-20 w-28 sm:w-36 animate-in fade-in zoom-in duration-300">
                <JaggedShoutBubble text="UPDATED!" />
              </div>

              {/* Score badge */}
              {spotlight?.score && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 border-2 border-black dark:border-white bg-white dark:bg-black px-2 py-0.5 text-xs font-black text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
                  <StarIcon className="size-3.5 text-black dark:text-amber-400 fill-black dark:fill-amber-400" />
                  <span>{spotlight.score.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Spotlight Details */}
            <div className="p-3.5 sm:p-4 pt-5 sm:pt-6 bg-white dark:bg-[#1a1b20] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                FEATURED SPOTLIGHT
              </span>
              <h3 className="font-manga-title text-base sm:text-xl font-black text-black dark:text-white line-clamp-1">
                {spotlightTitle}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {spotlight?.synopsis ?? "Follow the exciting journey in this top-rated anime series."}
              </p>
              
              <div className="pt-2">
                <Link
                  href={`/anime/${spotlight?.mal_id ?? 5114}`}
                  className="inline-flex items-center justify-center w-full min-h-[42px] py-2 bg-black dark:bg-white text-white dark:text-black font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5"
                >
                  Read & Watch Episode →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER MIDDLE: 2 STACKED PANELS ── */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 sm:gap-5">
          {/* Panel 1: LAST UPDATES */}
          <div className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-black dark:border-white">
              <h3 className="font-manga-title text-sm sm:text-base font-black tracking-wider text-black dark:text-white">
                LAST UPDATES
              </h3>
              <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                Recent Drops
              </span>
            </div>

            <ul className="divide-y divide-black/10 dark:divide-white/10">
              {SAMPLE_UPDATES.map((item) => (
                <li key={item.id} className="py-2 flex flex-col gap-0.5 group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-black dark:text-white group-hover:underline line-clamp-1">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    {item.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel 2: RECENT TOPICS */}
          <div className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-black dark:border-white">
              <h3 className="font-manga-title text-sm sm:text-base font-black tracking-wider text-black dark:text-white">
                RECENT FORUM TOPICS
              </h3>
              <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                Community
              </span>
            </div>

            <ul className="divide-y divide-black/10 dark:divide-white/10">
              {COMMUNITY_TOPICS.map((topic) => (
                <li key={topic.id} className="py-2 flex flex-col gap-0.5 group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-black dark:text-white group-hover:underline line-clamp-1 uppercase">
                      {topic.title}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                      {topic.time}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    By {topic.author}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT COLUMN: MASCOT CHARACTER + LEADERBOARD ── */}
        <div className="lg:col-span-3 flex flex-col gap-3.5 sm:gap-5">
          {/* Top: Manga Mascot */}
          <MangaMascot />

          {/* Bottom: "TOP PICKS OF THE WEEK" */}
          <div className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]">
            {/* Speed lines accent on corner */}
            <div className="absolute -top-3 -left-3 z-10">
              <ComicSpeedLines />
            </div>

            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-black dark:border-white">
              <h3 className="font-manga-title text-xs sm:text-sm font-black tracking-wider text-black dark:text-white">
                TOP PICKS OF THE WEEK
              </h3>
            </div>

            {/* Numbered Leaderboard #1 to #7 */}
            <div className="space-y-1 pt-1">
              {leaderboard.map((item, idx) => {
                const title = item.title_english ?? item.title;
                const rankNum = idx + 1;
                return (
                  <Link
                    key={item.mal_id}
                    href={`/anime/${item.mal_id}`}
                    className="flex items-center justify-between py-1.5 text-xs font-bold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 px-1.5 transition rounded-sm group min-h-[34px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-manga-title text-xs text-gray-500 dark:text-gray-400 w-4">
                        #{rankNum}
                      </span>
                      <span className="truncate group-hover:underline text-[11px] uppercase tracking-wide">
                        {title}
                      </span>
                    </div>
                    {item.score && (
                      <span className="font-mono text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0 ml-1">
                        ★ {item.score.toFixed(1)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM WIDE SHELF: "NEW CHAPTERS" / SEASONAL ANIME CAROUSEL
      ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
        
        {/* Section Header with Comic Speech Bubble */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b-2 border-black dark:border-white">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="font-manga-title text-lg sm:text-2xl font-black tracking-wide text-black dark:text-white uppercase">
              NEW CHAPTERS & EPISODES
            </h2>
            <SpeechBalloon text="EXCUSE ME?" tailPosition="bottom-left" />
          </div>

          {/* Mobile-Friendly Swipeable / Wrap Genre Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar">
            {GENRE_FILTERS.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreSelect(genre)}
                className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border-1.5 transition whitespace-nowrap min-h-[32px] shrink-0 cursor-pointer ${
                  selectedGenre === genre
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa]"
                    : "border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Anime Cards Grid - 2 cols on mobile, 3 sm, 4 md, 6 lg */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {displayedAnime.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>

        {isLoadingGenre && (
          <div className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Loading {selectedGenre} anime...
          </div>
        )}

        {/* Bottom Actions: Load More Button & Explore Full Catalog */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 sm:pt-4 border-t-2 border-dashed border-gray-300 dark:border-zinc-700">
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 min-h-[42px] cursor-pointer"
            >
              <span>Load More Anime</span>
              <ChevronDownIcon className="size-4" />
            </button>
          )}

          <Link
            href={
              selectedGenre === "All"
                ? "/search?type=popular"
                : `/search?genre=${encodeURIComponent(selectedGenre)}`
            }
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white dark:bg-[#1a1b20] text-black dark:text-white font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:translate-x-0.5 active:translate-y-0.5 min-h-[42px]"
          >
            <span>
              {selectedGenre === "All"
                ? "Explore Full Anime Catalog →"
                : `Explore All ${selectedGenre} Anime →`}
            </span>
          </Link>
        </div>
      </section>

    </div>
  );
}
