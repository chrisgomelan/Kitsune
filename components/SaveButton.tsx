"use client";

import { useState } from "react";
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

  if (!ready) {
    return <div className="h-28 w-full animate-pulse rounded-2xl bg-white/5" />;
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
    <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-5 ring-1 ring-white/10 backdrop-blur-sm space-y-3.5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="size-4 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            Your Watch Status
          </span>
        </div>
        {isSaved && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            In Library
          </span>
        )}
      </div>

      {/* Segmented Status Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatus(opt.id)}
              aria-pressed={isActive}
              className={`rounded-lg py-1.5 sm:py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
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
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-white/60">Episode:</span>
          <div className="flex items-center rounded-xl bg-white/10 p-0.5 ring-1 ring-white/15">
            <button
              type="button"
              onClick={() => handleStepEpisode(-1)}
              disabled={episode <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
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
                className="w-10 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
              />
              {totalEpisodes && (
                <span className="text-xs text-white/40 font-medium">/ {totalEpisodes}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleStepEpisode(1)}
              disabled={Boolean(totalEpisodes && episode >= totalEpisodes)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
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
            className="flex-1 sm:flex-initial h-9 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-md hover:bg-violet-500 active:scale-95 transition"
          >
            {isSaved ? "Update Progress" : "Save to Library"}
          </button>
          {isSaved && (
            <button
              type="button"
              onClick={handleRemove}
              className="h-9 rounded-xl border border-red-500/40 px-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 active:scale-95 transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Confirmation feedback */}
      {feedback && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 animate-in fade-in duration-150">
          <CheckIcon className="size-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
