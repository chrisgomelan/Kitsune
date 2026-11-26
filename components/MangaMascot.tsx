"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThoughtBubble } from "@/components/MangaSpeechBubbles";
import { useSavepoints } from "@/lib/savepoints";

export default function MangaMascot() {
  const { ready, list } = useSavepoints();
  const [currentIndex, setCurrentIndex] = useState(0);

  const savepoints = ready ? list() : [];
  
  // Prioritize shows currently in "watching" status
  const watchingList = savepoints.filter((s) => s.status === "watching");
  const displayList = watchingList.length > 0 ? watchingList : savepoints;
  const hasSavedAnime = displayList.length > 0;

  const currentAnime = hasSavedAnime
    ? displayList[currentIndex % displayList.length]
    : null;

  const handleNextShow = () => {
    setCurrentIndex((prev) => (prev + 1) % displayList.length);
  };

  // Dynamic thought bubble message based on real watch state
  let thoughtText = "MAYBE A NEW ANIME?";
  if (currentAnime) {
    if (currentAnime.status === "watching") {
      thoughtText = `CONTINUE EPISODE ${currentAnime.episode || 1}?`;
    } else if (currentAnime.status === "planned") {
      thoughtText = "START WATCHING TODAY?";
    } else if (currentAnime.status === "completed") {
      thoughtText = "REWATCH FAVORITES?";
    } else {
      thoughtText = "CONTINUE YOUR ADVENTURE?";
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] overflow-hidden">
      {/* Background Screentone Dots */}
      <div className="absolute inset-0 screentone-dots-subtle pointer-events-none opacity-40" />

      {/* Thought bubble popping from top */}
      <div className="relative z-10 w-full flex justify-center mb-1">
        <ThoughtBubble text={thoughtText} />
      </div>

      {/* Manga Character Illustration */}
      <div className="relative z-10 my-1 flex flex-col items-center select-none">
        <svg
          viewBox="0 0 140 170"
          className="w-24 h-32 sm:w-32 sm:h-40 text-black dark:text-white overflow-visible drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
        >
          {/* Angel/Kitsune halo outline */}
          <ellipse cx="70" cy="22" rx="28" ry="7" fill="none" stroke="currentColor" strokeWidth="2.5" />

          {/* Wings / Fox tails background */}
          <path
            d="M 35 70 C 10 50, 5 95, 25 125 C 35 110, 40 90, 42 80 Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M 105 70 C 130 50, 135 95, 115 125 C 105 110, 100 90, 98 80 Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* Head & Hair */}
          <ellipse cx="70" cy="52" rx="20" ry="22" className="fill-white dark:fill-[#1a1b20]" stroke="currentColor" strokeWidth="2" />
          <path d="M 50 48 Q 70 30 90 48 Q 82 72 70 60 Q 58 72 50 48 Z" fill="currentColor" />
          <path d="M 45 52 Q 40 75 52 80 Q 50 68 53 58 Z" fill="currentColor" />
          <path d="M 95 52 Q 100 75 88 80 Q 90 68 87 58 Z" fill="currentColor" />

          {/* Face: Eyes & Smile */}
          <circle cx="62" cy="54" r="2.5" className="fill-black dark:fill-white" />
          <circle cx="78" cy="54" r="2.5" className="fill-black dark:fill-white" />
          <path d="M 66 61 Q 70 65 74 61" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

          {/* Neck & Shirt Collar */}
          <path d="M 66 72 L 66 78 L 74 78 L 74 72 Z" className="fill-white dark:fill-[#1a1b20]" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="62,78 70,88 78,78 74,78 70,82 66,78" fill="currentColor" />

          {/* Suit Jacket */}
          <path
            d="M 52 82 L 40 120 L 55 128 L 70 100 L 85 128 L 100 120 L 88 82 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* Cross-legged Pants (Sitting pose) */}
          <path
            d="M 38 122 C 25 135, 30 152, 60 152 C 70 152, 70 145, 70 145 C 70 145, 70 152, 80 152 C 110 152, 115 135, 102 122 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* Folded Shoes */}
          <ellipse cx="50" cy="154" rx="14" ry="6" className="fill-white dark:fill-[#1a1b20]" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="90" cy="154" rx="14" ry="6" className="fill-white dark:fill-[#1a1b20]" stroke="currentColor" strokeWidth="2" />
        </svg>

        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
          {hasSavedAnime ? "Current Progress" : "Anime Guide"}
        </span>
      </div>

      {/* Dynamic Library Progress Widget */}
      <div className="relative z-10 w-full mt-2 pt-2 border-t-2 border-dashed border-black/20 dark:border-white/20 flex flex-col gap-2">
        {currentAnime ? (
          <div className="bg-[#f3f4f6] dark:bg-zinc-800 border-2 border-black dark:border-white p-2.5 rounded-sm">
            <div className="flex items-center gap-2.5">
              {currentAnime.image && (
                <div className="relative w-10 h-14 shrink-0 overflow-hidden border border-black dark:border-white bg-gray-200">
                  <Image
                    src={currentAnime.image}
                    alt={currentAnime.title}
                    fill
                    className="object-cover manga-grayscale-img"
                    sizes="40px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-black dark:text-white uppercase truncate">
                  {currentAnime.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase bg-black text-white dark:bg-white dark:text-black">
                    Ep {currentAnime.episode || 1}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 capitalize">
                    {currentAnime.status === "watching"
                      ? "Watching"
                      : currentAnime.status === "planned"
                      ? "In Watchlist"
                      : "Completed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <Link
                href={`/anime/${currentAnime.mal_id}`}
                className="flex-1 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-wider text-center border border-black dark:border-white shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 transition min-h-[34px] inline-flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
              >
                Resume Episode {currentAnime.episode || 1} →
              </Link>
              {displayList.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextShow}
                  aria-label="Cycle next saved show"
                  title="Switch to next saved anime in your library"
                  className="px-2.5 py-1.5 bg-white dark:bg-[#1a1b20] border border-black dark:border-white text-black dark:text-white text-[11px] font-bold uppercase hover:bg-gray-100 dark:hover:bg-zinc-700 transition min-h-[34px] inline-flex items-center justify-center shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                >
                  {currentIndex + 1}/{displayList.length}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-center">
            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-snug">
              Save any anime to track your episodes and resume right here.
            </p>
            <Link
              href="/search?type=popular"
              className="w-full min-h-[40px] py-2 bg-black dark:bg-white text-white dark:text-black font-manga-title text-xs tracking-wider uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 inline-flex items-center justify-center"
            >
              Explore Anime Catalog →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
