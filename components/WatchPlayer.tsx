"use client";

import { useEffect, useState, useTransition } from "react";
import { useSavepoints } from "@/lib/savepoints";

interface WatchPlayerProps {
  mal_id: number;
  anilist_id?: number;
  title: string;
  image: string;
  totalEpisodes: number | null;
}

const SERVERS = [
  {
    id: "vidrift",
    name: "VidRift Player (HD)",
    getUrl: (malId: number, aniId: number | undefined, ep: number) =>
      `https://embed.vidrift.net/embed/anilist/${aniId ?? malId}/${ep}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc Stream",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidsrc.me/embed/anime?id=${malId}&ep=${ep}`,
  },
  {
    id: "streamsearch",
    name: "StreamSearch Player",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://streamsearch.xyz/embed/anime/${malId}/${ep}`,
  },
  {
    id: "videasy",
    name: "Videasy Server",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://player.videasy.to/anime/${malId}/${ep}`,
  },
  {
    id: "vidlink-sub",
    name: "VidLink (Sub)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/sub?fallback=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
  },
  {
    id: "vidlink-dub",
    name: "VidLink (Dub)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/dub?fallback=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
  },
];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function WatchPlayer({
  mal_id,
  anilist_id,
  title,
  image,
  totalEpisodes,
}: WatchPlayerProps) {
  const { ready, get, upsert } = useSavepoints();
  const current = get(mal_id);

  const initialEpisode = current?.episode && current.episode > 0 ? current.episode : 1;
  const [episode, setEpisode] = useState<number>(initialEpisode);
  const [server, setServer] = useState(SERVERS[0].id);
  const [savedTime, setSavedTime] = useState<number>(current?.timestamp ?? 0);
  const [minutesInput, setMinutesInput] = useState<string>("");
  const [secondsInput, setSecondsInput] = useState<string>("");
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync state if savepoint is hydrated from localStorage
  useEffect(() => {
    if (ready && current) {
      if (current.episode && current.episode > 0) {
        setEpisode(current.episode);
      }
      if (current.timestamp !== undefined) {
        setSavedTime(current.timestamp);
        const m = Math.floor(current.timestamp / 60);
        const s = current.timestamp % 60;
        setMinutesInput(String(m));
        setSecondsInput(String(s));
      }
    }
  }, [ready, current]);

  const activeServer = SERVERS.find((s) => s.id === server) ?? SERVERS[0];
  const playerUrl = activeServer.getUrl(mal_id, anilist_id, episode);

  // Handle Episode Change
  const handleSelectEpisode = (ep: number) => {
    if (ep < 1) return;
    setEpisode(ep);
    setSavedTime(0);
    setMinutesInput("0");
    setSecondsInput("0");

    startTransition(() => {
      upsert(mal_id, title, image, "watching", ep, 0, 1440);
    });

    showToast(`Switched to Episode ${ep} and saved!`);
  };

  // Save manual or current timestamp
  const handleSaveTimestamp = () => {
    const mins = parseInt(minutesInput || "0", 10);
    const secs = parseInt(secondsInput || "0", 10);
    const totalSecs = Math.max(0, mins * 60 + secs);

    setSavedTime(totalSecs);
    upsert(mal_id, title, image, "watching", episode, totalSecs, 1440);
    showToast(`Saved progress: Ep ${episode} at ${formatTime(totalSecs)}!`);
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const maxEp = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 24;
  const episodeList = Array.from({ length: Math.min(maxEp, 50) }, (_, i) => i + 1);

  return (
    <div className="relative mt-8 space-y-5 rounded-3xl bg-white/[0.03] p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Watch Anime</h2>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Playing <span className="font-semibold text-violet-400">Episode {episode}</span>
            {savedTime > 0 && ` • Resume point: ${formatTime(savedTime)}`}
          </p>
        </div>

        {/* Server & Nav controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Server dropdown */}
          <select
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
          >
            {SERVERS.map((srv) => (
              <option key={srv.id} value={srv.id} className="bg-zinc-900 text-white">
                {srv.name}
              </option>
            ))}
          </select>

          {/* Float Window (Preserves subtitles in PiP/mini mode) */}
          <button
            onClick={() => {
              window.open(
                playerUrl,
                "KitsuneFloatPlayer",
                "width=854,height=480,left=100,top=100,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no"
              );
            }}
            title="Pop out a floating mini-player with subtitles preserved"
            className="rounded-xl bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/40 transition hover:bg-violet-600 hover:text-white active:scale-95 flex items-center gap-1.5"
          >
            <span>🗗</span> Mini Player (with Subs)
          </button>

          {/* Pop-out external player */}
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20"
          >
            ↗ New Tab
          </a>

          {/* Prev / Next buttons */}
          <button
            onClick={() => handleSelectEpisode(episode - 1)}
            disabled={episode <= 1}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
          >
            ← Prev
          </button>
          <button
            onClick={() => handleSelectEpisode(episode + 1)}
            disabled={Boolean(totalEpisodes && episode >= totalEpisodes)}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Embedded Video Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
        <iframe
          key={`${activeServer.id}-${episode}`}
          src={playerUrl}
          title={`${title} Episode ${episode}`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Help / Tip for Brave / Adblock */}
      <div className="flex items-center justify-between text-[11px] text-white/40">
        <span>💡 Tip: If video is blocked, turn off Brave Shields / adblocker for this site or click <strong>↗ Pop-out</strong>.</span>
      </div>

      {/* Timestamp / Checkpoint Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-white/60">Checkpoint:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              className="w-14 rounded-lg bg-white/10 px-2 py-1 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <span className="text-white/40">:</span>
            <input
              type="number"
              min={0}
              max={59}
              placeholder="Sec"
              value={secondsInput}
              onChange={(e) => setSecondsInput(e.target.value)}
              className="w-14 rounded-lg bg-white/10 px-2 py-1 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
          <button
            onClick={handleSaveTimestamp}
            className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-violet-500 active:scale-95"
          >
            Save Timestamp
          </button>
        </div>

        {savedTime > 0 && (
          <div className="text-xs text-white/60">
            Last saved at:{" "}
            <span className="font-semibold text-emerald-400">
              {formatTime(savedTime)}
            </span>
          </div>
        )}
      </div>

      {/* Toast notice */}
      {saveToast && (
        <div className="rounded-xl bg-emerald-500/20 px-4 py-2 text-center text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30 transition-all">
          ✓ {saveToast}
        </div>
      )}

      {/* Episode Selection Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-white/60">
          <span>Select Episode</span>
          {totalEpisodes && <span>{totalEpisodes} Episodes</span>}
        </div>
        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
          {episodeList.map((epNum) => {
            const isActive = epNum === episode;
            return (
              <button
                key={epNum}
                onClick={() => handleSelectEpisode(epNum)}
                className={`flex h-9 w-12 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg ring-2 ring-violet-400/80 scale-105"
                    : "bg-white/5 text-white/70 hover:bg-white/15 ring-1 ring-white/10"
                }`}
              >
                {epNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
