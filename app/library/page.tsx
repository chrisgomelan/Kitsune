"use client";

import Image from "next/image";
import Link from "next/link";
import { useSavepoints } from "@/lib/savepoints";
import BackupButtons from "@/components/BackupButtons";
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
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Library</h1>
          <p className="mt-1 text-sm text-white/40">
            {savepoints.length} {savepoints.length === 1 ? "savepoint" : "savepoints"} saved
          </p>
        </div>
        <BackupButtons />
      </header>

      {savepoints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-lg text-white/40">No savepoints yet.</p>
          <p className="mt-2 text-sm text-white/25">
            Browse anime and hit "Save to Library" to start tracking.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
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
                    Ep {sp.episode} · {new Date(sp.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`mt-2 w-fit rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${STATUS_COLORS[sp.status]}`}
                >
                  {STATUS_LABELS[sp.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
