"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSavepoints } from "@/lib/savepoints";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoIcon,
  MiniPlayerIcon,
} from "@/components/Icons";

interface WatchPlayerProps {
  mal_id: number;
  anilist_id?: number;
  title: string;
  image: string;
  totalEpisodes: number | null;
}

const SERVERS = [
  {
    id: "vidlink-sub",
    name: "VidLink (Sub - HD)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/sub?fallback=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
  },
  {
    id: "vidlink-dub",
    name: "VidLink (Dub)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/dub?fallback=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed (Multi-Source)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://player.autoembed.cc/embed/anime/${malId}/${ep}`,
  },
  {
    id: "videasy",
    name: "Videasy Server",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://player.videasy.to/anime/${malId}/${ep}`,
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc CC (Sub & Dub)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidsrc.cc/v2/embed/anime/${malId}/${ep}`,
  },
  {
    id: "embedsu",
    name: "Embed.su (Fast)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://embed.su/embed/anime/${malId}/${ep}`,
  },
  {
    id: "vidrift",
    name: "VidRift Player",
    getUrl: (malId: number, aniId: number | undefined, ep: number) =>
      `https://embed.vidrift.net/embed/anilist/${aniId ?? malId}/${ep}`,
  },
  {
    id: "vidsrc-me",
    name: "VidSrc Stream",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidsrc.me/embed/anime?id=${malId}&ep=${ep}`,
  },
  {
    id: "twoembed",
    name: "2Embed Player",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://www.2embed.cc/embed/anime/${malId}/${ep}`,
  },
  {
    id: "streamsearch",
    name: "StreamSearch",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://streamsearch.xyz/embed/anime/${malId}/${ep}`,
  },
];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const EPISODES_PER_CHUNK = 25;

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
  const [jumpInput, setJumpInput] = useState<string>("");
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

  // Determine total episode count (default to 24 if unknown, support 100+ if present)
  const effectiveMaxEp = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : Math.max(episode, 24);

  // Episode range chunk calculation (e.g. 1-25, 26-50, etc.)
  const chunkCount = Math.max(1, Math.ceil(effectiveMaxEp / EPISODES_PER_CHUNK));
  const currentChunkIndex = Math.floor((episode - 1) / EPISODES_PER_CHUNK);
  const [selectedChunk, setSelectedChunk] = useState<number>(currentChunkIndex);

  // Keep selected chunk in sync when episode changes
  useEffect(() => {
    setSelectedChunk(Math.floor((episode - 1) / EPISODES_PER_CHUNK));
  }, [episode]);

  const chunkEpisodes = useMemo(() => {
    const start = selectedChunk * EPISODES_PER_CHUNK + 1;
    const end = Math.min(start + EPISODES_PER_CHUNK - 1, effectiveMaxEp);
    const eps: number[] = [];
    for (let i = start; i <= end; i++) {
      eps.push(i);
    }
    return eps;
  }, [selectedChunk, effectiveMaxEp]);

  // Handle Episode Change
  const handleSelectEpisode = (ep: number) => {
    if (ep < 1 || (totalEpisodes && ep > totalEpisodes)) return;
    setEpisode(ep);
    setSavedTime(0);
    setMinutesInput("0");
    setSecondsInput("0");

    startTransition(() => {
      upsert(mal_id, title, image, "watching", ep, 0, 1440);
    });

    showToast(`Episode ${ep} loaded & saved!`);
  };

  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const epNum = parseInt(jumpInput, 10);
    if (!isNaN(epNum) && epNum >= 1 && (!totalEpisodes || epNum <= totalEpisodes)) {
      handleSelectEpisode(epNum);
      setJumpInput("");
    } else {
      showToast("Invalid episode number");
    }
  };

  // Save manual timestamp
  const handleSaveTimestamp = () => {
    const mins = parseInt(minutesInput || "0", 10);
    const secs = parseInt(secondsInput || "0", 10);
    const totalSecs = Math.max(0, mins * 60 + secs);

    setSavedTime(totalSecs);
    upsert(mal_id, title, image, "watching", episode, totalSecs, 1440);
    showToast(`Saved: Ep ${episode} at ${formatTime(totalSecs)}!`);
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="relative mt-8 space-y-4 rounded-2xl bg-white/[0.03] p-3.5 sm:space-y-5 sm:rounded-3xl sm:p-6 ring-1 ring-white/10 backdrop-blur-sm">
      {/* Toast notification */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex items-center gap-1.5 -translate-x-1/2 rounded-full bg-violet-600/95 px-5 py-2.5 text-xs font-semibold text-white shadow-xl shadow-violet-950/50 ring-1 ring-white/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckIcon className="size-4 shrink-0 text-white" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-lg font-bold text-white sm:text-xl">Watch Anime</h2>
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
              Ep {episode}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {savedTime > 0 ? (
              <>
                Resume point:{" "}
                <span className="font-semibold text-emerald-400">{formatTime(savedTime)}</span>
              </>
            ) : (
              "Streaming available on multiple servers"
            )}
          </p>
        </div>

        {/* Server & Desktop Popout actions */}
        <div className="flex items-center gap-2">
          {/* Server Select Dropdown - full-width on tiny screens */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              aria-label="Streaming Server"
              className="h-10 sm:h-9 w-full rounded-xl bg-white/10 pl-3 pr-8 text-xs font-semibold text-white/90 ring-1 ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer appearance-none transition hover:bg-white/15"
            >
              {SERVERS.map((srv) => (
                <option key={srv.id} value={srv.id} className="bg-zinc-900 text-white">
                  {srv.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50">
              <ChevronDownIcon className="size-3" />
            </span>
          </div>

          {/* Pop-out external player in new tab (works reliably on mobile and desktop) */}
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/20 active:scale-95 shrink-0"
          >
            <ExternalLinkIcon className="size-3.5" />
            <span>New Tab</span>
          </a>

          {/* Desktop-only Float Window (window.open popouts do not work well on mobile) */}
          <button
            onClick={() => {
              window.open(
                playerUrl,
                "KitsuneFloatPlayer",
                "width=854,height=480,left=100,top=100,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no"
              );
            }}
            title="Pop out a floating mini-player with subtitles preserved"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600/30 px-3 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/40 transition hover:bg-violet-600 hover:text-white active:scale-95 shrink-0"
          >
            <MiniPlayerIcon className="size-3.5" />
            <span>Mini Player</span>
          </button>
        </div>
      </div>

      {/* Embedded Video Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10 sm:rounded-2xl">
        <iframe
          key={`${activeServer.id}-${episode}`}
          src={playerUrl}
          title={`${title} Episode ${episode}`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Mobile-friendly Quick Prev / Next Episode Bar */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10 sm:p-2.5">
        <button
          onClick={() => handleSelectEpisode(episode - 1)}
          disabled={episode <= 1}
          aria-label="Previous episode"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:flex-initial sm:px-4"
        >
          <ChevronLeftIcon className="size-4" />
          <span>Prev Ep</span>
        </button>

        <div className="text-center text-xs font-medium text-white/70">
          <span className="font-bold text-white">Episode {episode}</span>
          {totalEpisodes && <span className="text-white/40"> / {totalEpisodes}</span>}
        </div>

        <button
          onClick={() => handleSelectEpisode(episode + 1)}
          disabled={Boolean(totalEpisodes && episode >= totalEpisodes)}
          aria-label="Next episode"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white transition hover:bg-violet-500 active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:flex-initial sm:px-4"
        >
          <span>Next Ep</span>
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      {/* Tip for playback issues */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90 ring-1 ring-amber-500/20">
        <InfoIcon className="size-3.5 shrink-0 mt-0.5 text-amber-300" />
        <span>
          <strong>Tip:</strong> If the video won&apos;t load, switch servers above or tap <strong>New Tab</strong>. On mobile, disable adblocker/shields if playback is blocked.
        </span>
      </div>

      {/* Timestamp / Checkpoint Bar */}
      <div className="flex flex-col gap-3 rounded-xl bg-white/[0.04] p-3 sm:rounded-2xl sm:p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
            <BookmarkIcon className="size-3.5 text-violet-400" />
            <span>Bookmark:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              placeholder="Min"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              aria-label="Bookmark minutes"
              className="h-10 sm:h-8 w-14 rounded-lg bg-white/10 px-2 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <span className="text-white/40 font-bold">:</span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={59}
              placeholder="Sec"
              value={secondsInput}
              onChange={(e) => setSecondsInput(e.target.value)}
              aria-label="Bookmark seconds"
              className="h-10 sm:h-8 w-14 rounded-lg bg-white/10 px-2 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          <button
            onClick={handleSaveTimestamp}
            className="h-10 sm:h-8 flex-1 sm:flex-initial rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow transition hover:bg-violet-500 active:scale-95"
          >
            Save Bookmark
          </button>
        </div>

        {savedTime > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Last bookmark:</span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              {formatTime(savedTime)}
            </span>
          </div>
        )}
      </div>

      {/* Episode Selection Section */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-white/70">
          <span>Select Episode</span>

          {/* Quick jump input for quick mobile navigation */}
          {effectiveMaxEp > 12 && (
            <form onSubmit={handleJumpToEpisode} className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={totalEpisodes ?? 9999}
                placeholder="Ep #"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="h-7 w-16 rounded-lg bg-white/10 px-2 text-center text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                type="submit"
                className="h-7 rounded-lg bg-white/10 px-2.5 text-[11px] font-medium text-white hover:bg-white/20 active:scale-95 transition"
              >
                Go
              </button>
            </form>
          )}
        </div>

        {/* Range Tabs if anime has more than 25 episodes */}
        {chunkCount > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: chunkCount }, (_, idx) => {
              const start = idx * EPISODES_PER_CHUNK + 1;
              const end = Math.min(start + EPISODES_PER_CHUNK - 1, effectiveMaxEp);
              const isCurrent = selectedChunk === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedChunk(idx)}
                  className={`h-8 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap transition-all ${
                    isCurrent
                      ? "bg-violet-600 text-white shadow-md ring-1 ring-violet-400"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {start}–{end}
                </button>
              );
            })}
          </div>
        )}

        {/* Episode Grid with responsive column layout and comfortable tap targets */}
        <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1 sm:grid-cols-8 md:grid-cols-10">
          {chunkEpisodes.map((epNum) => {
            const isActive = epNum === episode;
            return (
              <button
                key={epNum}
                onClick={() => handleSelectEpisode(epNum)}
                className={`flex h-10 items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg ring-2 ring-violet-400/90 scale-105"
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
