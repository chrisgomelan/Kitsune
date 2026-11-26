"use client";

import Image from "next/image";
import Link from "next/link";
import { useSavepoints } from "@/lib/savepoints";
import { BookmarkIcon } from "@/components/Icons";
import { SpeechBalloon } from "@/components/MangaSpeechBubbles";
import type { WatchStatus } from "@/types/anime";

const STATUS_BADGES: Record<WatchStatus, string> = {
  watching: "bg-black text-white dark:bg-white dark:text-black",
  planned: "bg-white text-black dark:bg-[#1a1b20] dark:text-white border border-black dark:border-white",
  completed: "bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border border-black dark:border-white",
  dropped: "bg-gray-100 dark:bg-zinc-900 text-gray-500 line-through",
};

const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  planned: "Plan to Watch",
  completed: "Completed",
  dropped: "Dropped",
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function LibraryPage() {
  const { ready, list } = useSavepoints();
  const savepoints = list();

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin border-4 border-black dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Panel */}
      <header className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-5 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-manga-title text-xl sm:text-3xl font-black text-black dark:text-white tracking-wide uppercase">
            My Anime Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
            {savepoints.length} {savepoints.length === 1 ? "title" : "titles"} saved on this device
          </p>
        </div>
        <div>
          <SpeechBalloon text="YOUR SAVED SHOWS" tailPosition="bottom-right" />
        </div>
      </header>

      {savepoints.length === 0 ? (
        <div className="flex flex-col items-center bg-white dark:bg-[#1a1b20] border-2 border-dashed border-black dark:border-white py-12 sm:py-16 px-4 text-center shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center border-2 border-black dark:border-white bg-gray-100 dark:bg-zinc-800 text-black dark:text-white">
            <BookmarkIcon className="size-6" />
          </div>
          <p className="font-manga-title text-base sm:text-lg font-black text-black dark:text-white uppercase">
            No Saved Anime Yet
          </p>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm">
            Browse any show on Kitsune and click &quot;Save to Library&quot; to keep track of your episodes.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block border-2 border-black dark:border-white bg-black dark:bg-white px-5 py-2.5 font-manga-title text-xs sm:text-sm font-bold uppercase tracking-wider text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 min-h-[42px]"
          >
            Explore Anime Catalog →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {savepoints.map((sp) => (
            <Link
              key={sp.mal_id}
              href={`/anime/${sp.mal_id}`}
              className="group flex gap-3.5 bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3 sm:p-3.5 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] hover:shadow-[5px_5px_0px_#000000] dark:hover:shadow-[5px_5px_0px_#ffffff] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              {/* Poster */}
              <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden border border-black dark:border-white bg-gray-100 dark:bg-zinc-800">
                <Image
                  src={sp.image}
                  alt={`${sp.title} poster`}
                  fill
                  className="object-cover manga-grayscale-img"
                  sizes="64px"
                />
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h2 className="truncate text-xs sm:text-sm font-bold text-black dark:text-white group-hover:underline uppercase tracking-wide">
                    {sp.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Ep {sp.episode || 1}
                    {sp.timestamp && sp.timestamp > 0 ? ` • ${formatTime(sp.timestamp)}` : ""}
                    {" · "}
                    {new Date(sp.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[sp.status]}`}
                  >
                    {STATUS_LABELS[sp.status]}
                  </span>
                  <span className="text-xs font-bold text-black dark:text-white group-hover:translate-x-1 transition-transform">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
