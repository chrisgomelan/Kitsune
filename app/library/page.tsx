"use client";

import Image from "next/image";
import Link from "next/link";
import { useSavepoints } from "@/lib/savepoints";
import { BookmarkIcon, ChevronRightIcon } from "@/components/Icons";
import type { WatchStatus } from "@/types/anime";

const STATUS_COLORS: Record<WatchStatus, string> = {
  watching: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  planned: "bg-yellow-500/20 text-yellow-300 ring-yellow-500/30",
  completed: "bg-green-500/20 text-green-300 ring-green-500/30",
  dropped: "bg-red-500/20 text-red-300 ring-red-500/30",
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
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">My Library</h1>
        <p className="mt-1 text-sm text-white/40">
          {savepoints.length} {savepoints.length === 1 ? "savepoint" : "savepoints"} saved
        </p>
      </header>

      {savepoints.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-16 px-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40 ring-1 ring-white/10">
            <BookmarkIcon className="size-6" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-white/60">No savepoints yet.</p>
          <p className="mt-1 text-xs sm:text-sm text-white/40 max-w-sm">
            Browse anime and hit &quot;Save to Library&quot; to start tracking your progress.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-95"
          >
            Discover Anime
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savepoints.map((sp) => (
            <Link
              key={sp.mal_id}
              href={`/anime/${sp.mal_id}`}
              className="group flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:ring-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {/* Poster */}
              <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={sp.image}
                  alt={`${sp.title} poster`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h2 className="truncate font-semibold text-white group-hover:text-violet-300 transition-colors">
                    {sp.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-white/40">
                    Ep {sp.episode || 1}
                    {sp.timestamp && sp.timestamp > 0 ? ` • ${formatTime(sp.timestamp)}` : ""}
                    {" · "}
                    {new Date(sp.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${STATUS_COLORS[sp.status]}`}
                  >
                    {STATUS_LABELS[sp.status]}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Resume</span>
                    <ChevronRightIcon className="size-3" />
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
