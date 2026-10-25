"use client";

import { useState } from "react";
import { useSavepoints } from "@/lib/savepoints";
import type { WatchStatus } from "@/types/anime";

interface SaveButtonProps {
  mal_id: number;
  title: string;
  image: string;
  totalEpisodes: number | null;
}

const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  planned: "Plan to Watch",
  completed: "Completed",
  dropped: "Dropped",
};

export default function SaveButton({ mal_id, title, image, totalEpisodes }: SaveButtonProps) {
  const { ready, get, upsert, remove } = useSavepoints();
  const current = get(mal_id);

  const [status, setStatus] = useState<WatchStatus>(current?.status ?? "planned");
  const [episode, setEpisode] = useState<number>(current?.episode ?? 0);

  if (!ready) {
    return <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />;
  }

  const isSaved = Boolean(current);

  const handleSave = () => {
    upsert(mal_id, title, image, status, episode);
  };

  const handleRemove = () => {
    remove(mal_id);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status selector */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Watch status">
        {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              status === s
                ? "bg-violet-600 text-white shadow-lg"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Episode input */}
      <div className="flex items-center gap-3">
        <label htmlFor={`episode-${mal_id}`} className="text-sm text-white/70">
          Episode
        </label>
        <input
          id={`episode-${mal_id}`}
          type="number"
          min={0}
          max={totalEpisodes ?? undefined}
          value={episode}
          onChange={(e) => setEpisode(Math.max(0, Number(e.target.value)))}
          className="w-20 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
        {totalEpisodes && (
          <span className="text-sm text-white/40">/ {totalEpisodes}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
        >
          {isSaved ? "Update Savepoint" : "Save to Library"}
        </button>
        {isSaved && (
          <button
            onClick={handleRemove}
            className="rounded-xl border border-red-500/50 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
