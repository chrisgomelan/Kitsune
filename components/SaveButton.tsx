"use client";

import { useEffect, useState } from "react";
import { useSavepoints } from "@/lib/savepoints";
import { BookmarkIcon, CheckIcon } from "@/components/Icons";
import type { WatchStatus } from "@/types/anime";

interface SaveButtonProps {
  mal_id: number;
  title: string;
  image: string;
  totalEpisodes: number | null;
}

const STATUS_OPTIONS: { id: WatchStatus; label: string }[] = [
  { id: "watching", label: "Watching" },
  { id: "planned", label: "Plan to Watch" },
  { id: "completed", label: "Completed" },
  { id: "dropped", label: "Dropped" },
];

export default function SaveButton({ mal_id, title, image, totalEpisodes }: SaveButtonProps) {
  const { ready, get, upsert, remove } = useSavepoints();
  const current = get(mal_id);

  const [status, setStatus] = useState<WatchStatus>(current?.status ?? "planned");
  const [episode, setEpisode] = useState<number>(current?.episode ?? 0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync state when savepoint changes
  useEffect(() => {
    if (current) {
      if (current.status) setStatus(current.status);
      if (typeof current.episode === "number") setEpisode(current.episode);
    }
  }, [current]);

  if (!ready) {
    return <div className="h-28 w-full animate-pulse border-2 border-black dark:border-white bg-gray-100 dark:bg-zinc-800" />;
  }

  const isSaved = Boolean(current);

  const handleSave = () => {
    upsert(mal_id, title, image, status, episode);
    setFeedback("Saved to your library!");
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleRemove = () => {
    remove(mal_id);
    setFeedback("Removed from your library");
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleStepEpisode = (delta: number) => {
    setEpisode((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (totalEpisodes && next > totalEpisodes) return totalEpisodes;
      return next;
    });
  };

  return (
    <div className="border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900 p-3.5 sm:p-4 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <BookmarkIcon className="size-4 text-black dark:text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
            Your Watch Progress
          </span>
        </div>
        {isSaved && (
          <span className="border border-black dark:border-white bg-black dark:bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:text-black">
            In Library
          </span>
        )}
      </div>

      {/* Segmented Status Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 border border-black dark:border-white bg-white dark:bg-[#1a1b20] p-1">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatus(opt.id)}
              aria-pressed={isActive}
              className={`py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-[1.5px_1.5px_0px_#555555] dark:shadow-[1.5px_1.5px_0px_#aaaaaa]"
                  : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Controls row: Episode stepper + Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Episode Stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Episode:</span>
          <div className="flex items-center border border-black dark:border-white bg-white dark:bg-[#1a1b20]">
            <button
              type="button"
              onClick={() => handleStepEpisode(-1)}
              disabled={episode <= 0}
              className="flex h-8 w-8 items-center justify-center font-bold text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
              aria-label="Decrease episode"
            >
              −
            </button>
            <div className="flex items-center px-2">
              <input
                type="number"
                min={0}
                max={totalEpisodes ?? undefined}
                value={episode}
                onChange={(e) => setEpisode(Math.max(0, Number(e.target.value)))}
                aria-label="Episode progress"
                className="w-10 bg-transparent text-center text-xs font-bold text-black dark:text-white focus:outline-none"
              />
              {totalEpisodes && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">/ {totalEpisodes}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleStepEpisode(1)}
              disabled={Boolean(totalEpisodes && episode >= totalEpisodes)}
              className="flex h-8 w-8 items-center justify-center font-bold text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
              aria-label="Increase episode"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial h-9 border border-black dark:border-white bg-black dark:bg-white px-4 text-xs font-bold uppercase tracking-wider text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 active:translate-x-0.5 active:translate-y-0.5 transition"
          >
            {isSaved ? "Update Progress" : "Save to Library"}
          </button>
          {isSaved && (
            <button
              type="button"
              onClick={handleRemove}
              className="h-9 border border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Confirmation feedback */}
      {feedback && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white border border-black dark:border-white bg-white dark:bg-[#1a1b20] p-1.5 animate-in fade-in duration-150">
          <CheckIcon className="size-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
