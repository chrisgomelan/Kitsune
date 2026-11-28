"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSavepoints } from "@/lib/savepoints";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FastForwardIcon,
  InfoIcon,
  MiniPlayerIcon,
} from "@/components/Icons";

interface WatchPlayerProps {
  mal_id: number;
  anilist_id?: number;
  title: string;
  image: string;
  totalEpisodes: number | null;
  airedEpisodes?: number | null;
  status?: string | null;
}

const SERVERS = [
  {
    id: "vidrift",
    name: "VidRift Player (HD)",
    getUrl: (malId: number, aniId: number | undefined, ep: number) =>
      `https://embed.vidrift.net/embed/anilist/${aniId ?? malId}/${ep}`,
  },
  {
    id: "vidlink-sub",
    name: "VidLink (Sub - HD)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/sub?fallback=true&nextbutton=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
  },
  {
    id: "vidlink-dub",
    name: "VidLink (Dub)",
    getUrl: (malId: number, _aniId: number | undefined, ep: number) =>
      `https://vidlink.pro/anime/${malId}/${ep}/dub?fallback=true&nextbutton=true&primaryColor=8b5cf6&secondaryColor=6366f1`,
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
  const rounded = Math.floor(totalSeconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

interface SkipInterval {
  startTime: number;
  endTime: number;
  skipType: string;
}

const EPISODES_PER_CHUNK = 25;

export default function WatchPlayer({
  mal_id,
  anilist_id,
  title,
  image,
  totalEpisodes,
  airedEpisodes,
  status,
}: WatchPlayerProps) {
  const { ready, get, upsert } = useSavepoints();
  const current = get(mal_id);

  const initialEpisode = current?.episode && current.episode > 0 ? current.episode : 1;
  const [episode, setEpisode] = useState<number>(initialEpisode);
  const [playerEpisode, setPlayerEpisode] = useState<number>(initialEpisode);
  const [server, setServer] = useState(SERVERS[0].id);
  const [savedTime, setSavedTime] = useState<number>(current?.timestamp ?? 0);
  const [minutesInput, setMinutesInput] = useState<string>("");
  const [secondsInput, setSecondsInput] = useState<string>("");
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState<string>("");
  const [, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [skipIntervals, setSkipIntervals] = useState<SkipInterval[]>([]);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);
  const [playerTmdbId, setPlayerTmdbId] = useState<number | string | null>(null);

  // Fetch intro intervals from TheIntroDB & AniSkip (the exact same sources VidRift uses)
  useEffect(() => {
    let isMounted = true;

    async function fetchSkipTimes() {
      const intervals: SkipInterval[] = [];

      // 1. TheIntroDB (exact timings for TV/anime, e.g. 135s -> 225s / 3:45 for Chainsaw Man)
      if (playerTmdbId) {
        try {
          const res = await fetch(
            `https://api.theintrodb.org/v3/media?tmdb_id=${playerTmdbId}&season=1&episode=${episode}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.intro && Array.isArray(data.intro)) {
              for (const seg of data.intro) {
                if (seg.end_ms && seg.end_ms > 0) {
                  intervals.push({
                    startTime: Math.floor((seg.start_ms || 0) / 1000),
                    endTime: Math.floor(seg.end_ms / 1000),
                    skipType: "op",
                  });
                }
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      // 2. AniSkip (crowdsourced anime skip intervals)
      try {
        const res = await fetch(
            `https://api.aniskip.com/v2/skip-times/${mal_id}/${episode}?types[]=op&types[]=ed&types[]=recap&episodeLength=0`
        );
          if (res.ok) {
            const data = await res.json();
            if (data.found && Array.isArray(data.results)) {
              data.results.forEach(
                (r: { interval: { startTime: number; endTime: number }; skipType: string }) => {
                  if (r.interval?.endTime) {
                    intervals.push({
                      startTime: Math.floor(r.interval.startTime),
                      endTime: Math.floor(r.interval.endTime),
                      skipType: r.skipType,
                    });
                  }
                }
              );
            }
          }
        } catch {
          // Ignore
        }

        if (isMounted) {
          // Prioritize earlier start time intervals so accurate OP timings come first
          intervals.sort((a, b) => a.startTime - b.startTime);
          setSkipIntervals(intervals);
        }
      }

    fetchSkipTimes();
      return () => {
        isMounted = false;
      };
}, [mal_id, episode, playerTmdbId]);

const opInterval = useMemo(
  () => skipIntervals.find((i) => i.skipType === "op"),
  [skipIntervals]
);

// Read ?ep= from URL on mount
useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const epParam = parseInt(params.get("ep") || "", 10);
    if (!isNaN(epParam) && epParam >= 1 && (!totalEpisodes || epParam <= totalEpisodes)) {
      setEpisode(epParam);
      setPlayerEpisode(epParam);
    }
  }
}, [totalEpisodes]);

// Sync state if savepoint is hydrated from localStorage
useEffect(() => {
  if (ready && current) {
    if (current.episode && current.episode > 0) {
      setEpisode(current.episode);
      setPlayerEpisode(current.episode);
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

// Keep browser URL (?ep=) in sync with current episode
useEffect(() => {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ep") !== String(episode)) {
      url.searchParams.set("ep", String(episode));
      window.history.replaceState(null, "", url.toString());
    }
  }
}, [episode]);

const activeServer = SERVERS.find((s) => s.id === server) ?? SERVERS[0];
const iframeUrl = activeServer.getUrl(mal_id, anilist_id, playerEpisode);
const currentEpisodeUrl = activeServer.getUrl(mal_id, anilist_id, episode);

// Send nextup info to VidRift player if supported
const sendNextUpInfo = useCallback(() => {
  if (activeServer.id === "vidrift" && iframeRef.current?.contentWindow) {
    try {
      const nextEpNum = episode + 1;
      const hasNext = !totalEpisodes || nextEpNum <= totalEpisodes;
      iframeRef.current.contentWindow.postMessage(
        {
          type: "vidrift:nextup-info",
          next: hasNext
            ? {
              season: 1,
              episode: nextEpNum,
              name: `Episode ${nextEpNum}`,
            }
            : null,
        },
        "*"
      );
    } catch {
      // Cross-origin safe ignore
    }
  }
}, [activeServer.id, episode, totalEpisodes]);

useEffect(() => {
  sendNextUpInfo();
}, [sendNextUpInfo]);

// The highest episode available to stream
const availableMaxEp =
  airedEpisodes && airedEpisodes > 0
    ? airedEpisodes
    : totalEpisodes && totalEpisodes > 0
    ? totalEpisodes
    : Math.max(episode, 24);

// Determine total episode count to render (support planned season count if known)
const effectiveMaxEp = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : availableMaxEp;

// Dynamically size episode chunks: 25 for short, 50 for medium (60-300), 100 for long series (300+)
const episodesPerChunk =
  effectiveMaxEp > 300 ? 100 : effectiveMaxEp > 60 ? 50 : 25;

// Episode range chunk calculation
const chunkCount = Math.max(1, Math.ceil(effectiveMaxEp / episodesPerChunk));
const currentChunkIndex = Math.floor((episode - 1) / episodesPerChunk);
const [selectedChunk, setSelectedChunk] = useState<number>(currentChunkIndex);

// Keep selected chunk in sync when episode changes
useEffect(() => {
  setSelectedChunk(Math.floor((episode - 1) / episodesPerChunk));
}, [episode, episodesPerChunk]);

const chunkEpisodes = useMemo(() => {
  const start = selectedChunk * episodesPerChunk + 1;
  const end = Math.min(start + episodesPerChunk - 1, effectiveMaxEp);
  const eps: number[] = [];
  for (let i = start; i <= end; i++) {
    eps.push(i);
  }
  return eps;
}, [selectedChunk, episodesPerChunk, effectiveMaxEp]);

// Handle Episode Change triggered by user clicking on webpage controls
const handleSelectEpisode = useCallback(
  (ep: number) => {
    if (ep < 1 || ep > availableMaxEp) {
      showToast(`Episode ${ep} has not aired yet.`);
      return;
    }
    setEpisode(ep);
    setPlayerEpisode(ep);
    setSavedTime(0);
    setMinutesInput("0");
    setSecondsInput("0");

    startTransition(() => {
      upsert(mal_id, title, image, "watching", ep, 0, 1440);
    });

    showToast(`Episode ${ep} loaded & saved!`);
  },
  [availableMaxEp, mal_id, title, image, upsert]
);

// Handle Episode Change detected from inside the video player (iframe postMessage)
const handleSyncEpisodeFromPlayer = useCallback(
  (ep: number) => {
    if (ep < 1 || ep > availableMaxEp) return;
    if (ep === episode) return;

    setEpisode(ep);
    // We deliberately keep playerEpisode unchanged if the iframe has already
    // navigated internally, preventing an unwanted iframe remount/restart.
    setSavedTime(0);
    setMinutesInput("0");
    setSecondsInput("0");

    startTransition(() => {
      upsert(mal_id, title, image, "watching", ep, 0, 1440);
    });

    showToast(`Synced: Episode ${ep}!`);
  },
  [episode, totalEpisodes, mal_id, title, image, upsert]
);

const handleServerChange = (newServerId: string) => {
  setServer(newServerId);
  setPlayerEpisode(episode);
};

// Listen to postMessage events from embedded streaming players (VidRift, VidLink, etc.)
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (!event.data) return;

    let data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // Plain text format (e.g. "vidrift:episode:4")
        if (typeof event.data === "string" && event.data.includes("vidrift:episode")) {
          const m = event.data.match(/vidrift:episode[:\s]+(\d+)/i);
          if (m) {
            const epNum = parseInt(m[1], 10);
            if (!isNaN(epNum) && epNum >= 1) {
              handleSyncEpisodeFromPlayer(epNum);
            }
          }
        }
        return;
      }
    }

    if (!data || typeof data !== "object") return;

    // 1. VidRift events
      if (data.type === "vidrift:progress") {
        if (typeof data.currentTime === "number") {
          setPlayerCurrentTime(Math.floor(data.currentTime));
        }
        if (data.tmdbId) {
          setPlayerTmdbId(data.tmdbId);
        }
      }

      if (data.type === "vidrift:episode" && data.episode !== undefined) {
        const epNum = Number(data.episode);
        if (!isNaN(epNum) && epNum >= 1) {
          handleSyncEpisodeFromPlayer(epNum);
          return;
        }
      }

      if (data.type === "vidrift:nextup-play") {
        const epNum = Number(data.episode);
        if (!isNaN(epNum) && epNum >= 1) {
          handleSyncEpisodeFromPlayer(epNum);
        } else {
          handleSelectEpisode(episode + 1);
        }
        return;
      }

      // 2. VidLink MEDIA_DATA
      if (data.type === "MEDIA_DATA") {
        const payload = data.data || data;
        const epNum = Number(payload.episode ?? payload.current_episode ?? payload.number);
        if (!isNaN(epNum) && epNum >= 1 && epNum !== episode) {
          handleSyncEpisodeFromPlayer(epNum);
        }
        return;
      }

      // 3. Generic episode change messages
      const detectedEp = Number(
        data.episode ??
        data.episode_number ??
        data.currentEpisode ??
        data.nextEpisode ??
        data.data?.episode
      );

      if (
        !isNaN(detectedEp) &&
        detectedEp >= 1 &&
        detectedEp !== episode &&
        (data.type?.includes?.("episode") ||
          data.event?.includes?.("episode") ||
          data.action === "episode_change")
      ) {
        handleSyncEpisodeFromPlayer(detectedEp);
        return;
      }

      if (
        data.type === "next_episode" ||
        data.event === "next_episode" ||
        data.action === "next_episode"
      ) {
        handleSelectEpisode(episode + 1);
        return;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [episode, handleSyncEpisodeFromPlayer, handleSelectEpisode]);

const handleJumpToEpisode = (e: React.FormEvent) => {
  e.preventDefault();
  const epNum = parseInt(jumpInput, 10);
  if (!isNaN(epNum) && epNum >= 1 && epNum <= availableMaxEp) {
    handleSelectEpisode(epNum);
    setJumpInput("");
  } else if (!isNaN(epNum) && epNum > availableMaxEp) {
    showToast(`Episode ${epNum} has not aired yet`);
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

const handleSkipIntro = () => {
  // Jump directly to the exact end timestamp of the intro (e.g. 225s / 3:45)
  const exactEndTime = opInterval
    ? opInterval.endTime
    : (playerCurrentTime > 0 ? playerCurrentTime + 85 : 85);

  if (iframeRef.current?.contentWindow) {
    try {
      const targetOrigin = activeServer.id === "vidrift" ? "https://embed.vidrift.net" : "*";

      // VidRift absolute seek via vidrift:resume sets video.currentTime directly to exact end timestamp!
      iframeRef.current.contentWindow.postMessage(
        {
          type: "vidrift:resume",
          currentTime: exactEndTime,
        },
        targetOrigin
      );
      iframeRef.current.contentWindow.postMessage(
        {
          type: "vidrift:resume",
          currentTime: exactEndTime,
        },
        "*"
      );

      showToast(`Skipped to ${formatTime(exactEndTime)}!`);
    } catch {
      // Cross-origin safe ignore
    }
  }
};

return (
  <div className="relative space-y-4 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] p-3.5 sm:p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
    {/* Toast notification */}
    {saveToast && (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 left-1/2 z-50 flex items-center gap-1.5 -translate-x-1/2 border-2 border-black bg-black px-5 py-2 text-xs font-black uppercase text-white shadow-[4px_4px_0px_#ffffff] animate-in fade-in duration-200"
      >
        <CheckIcon className="size-4 shrink-0 text-white" />
        <span>{saveToast}</span>
      </div>
    )}

    {/* Header Info */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-black dark:border-white pb-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black dark:bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-black dark:bg-white" />
          </span>
          <h2 className="font-manga-title text-xl sm:text-2xl font-black text-black dark:text-white tracking-wide uppercase">
            Watch Episode
          </h2>
          <span className="border-1.5 border-black dark:border-white bg-black dark:bg-white px-2 py-0.5 text-xs font-bold uppercase text-white dark:text-black shadow-[1.5px_1.5px_0px_#555555] dark:shadow-[1.5px_1.5px_0px_#aaaaaa]">
            Ep {episode}
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
          {savedTime > 0 ? (
            <>
              Resume bookmark:{" "}
              <strong className="text-black dark:text-white font-mono">{formatTime(savedTime)}</strong>
            </>
          ) : (
            "Choose a streaming server below if video doesn't play automatically"
          )}
        </p>
      </div>

      {/* Server & Desktop Popout actions */}
      <div className="flex items-center gap-2">
        {/* Server Select Dropdown */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={server}
            onChange={(e) => handleServerChange(e.target.value)}
            aria-label="Streaming Server"
            className="h-9 w-full border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] pl-3 pr-8 text-xs font-bold text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] focus:outline-none cursor-pointer appearance-none"
          >
            {SERVERS.map((srv) => (
              <option key={srv.id} value={srv.id} className="bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold">
                {srv.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black dark:text-white">
            <ChevronDownIcon className="size-3" />
          </span>
        </div>

        {/* Pop-out external player in new tab */}
        <a
          href={currentEpisodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new window"
          className="flex h-9 items-center justify-center gap-1.5 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3 text-xs font-bold uppercase text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:translate-x-0.5 active:translate-y-0.5 shrink-0"
        >
          <ExternalLinkIcon className="size-3.5" />
          <span>New Tab</span>
        </a>

        {/* Desktop Float Window */}
        <button
          onClick={() => {
            window.open(
              currentEpisodeUrl,
              "KitsuneFloatPlayer",
              "width=854,height=480,left=100,top=100,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no"
            );
          }}
          title="Pop out a floating mini-player"
          className="hidden sm:inline-flex h-9 items-center gap-1.5 border-2 border-black dark:border-white bg-black dark:bg-white px-3 text-xs font-bold uppercase text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 shrink-0"
        >
          <MiniPlayerIcon className="size-3.5" />
          <span>Mini Player</span>
        </button>
      </div>
    </div>

    {/* Embedded Video Player - framed in ink */}
    <div className="relative aspect-video w-full overflow-hidden border-2 border-black dark:border-white bg-black shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
      <iframe
        ref={iframeRef}
        key={`${activeServer.id}-${playerEpisode}`}
        src={iframeUrl}
        title={`${title} Episode ${episode}`}
        onLoad={sendNextUpInfo}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
      />
    </div>

    {/* Quick Prev / Next Episode Bar & Skip Intro */}
    <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900 p-2.5 sm:p-3 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
      <div className="flex items-center gap-2 flex-1 sm:flex-initial">
        <button
          onClick={() => handleSelectEpisode(episode - 1)}
          disabled={episode <= 1}
          aria-label="Previous episode"
          className="flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3 text-xs font-bold uppercase text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-30 sm:px-4"
        >
          <ChevronLeftIcon className="size-4" />
          <span>Prev Ep</span>
        </button>

        <button
          type="button"
          onClick={handleSkipIntro}
          title={opInterval ? `Skip intro to ${formatTime(opInterval.endTime)}` : "Skip intro"}
          className="flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-3 text-xs font-bold uppercase text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-yellow-100 dark:hover:bg-zinc-800 transition active:translate-x-0.5 active:translate-y-0.5"
        >
          <FastForwardIcon className="size-3.5" />
          <span>Skip Intro</span>
        </button>
      </div>

      <div className="text-center font-manga-title text-xs sm:text-sm font-bold text-black dark:text-white order-last sm:order-none w-full sm:w-auto tracking-wide uppercase">
        <span>Episode {episode}</span>
        {airedEpisodes && totalEpisodes && airedEpisodes < totalEpisodes ? (
          <span className="text-gray-500 dark:text-gray-400 font-sans font-semibold">
            {" "}
            / {airedEpisodes}{" "}
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
              ({totalEpisodes} Planned)
            </span>
          </span>
        ) : totalEpisodes ? (
          <span className="text-gray-500 dark:text-gray-400 font-sans font-semibold">
            {" "}
            / {totalEpisodes}
          </span>
        ) : null}
      </div>

      <button
        onClick={() => handleSelectEpisode(episode + 1)}
        disabled={Boolean(availableMaxEp && episode >= availableMaxEp)}
        aria-label="Next episode"
        className="flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 border-2 border-black dark:border-white bg-black dark:bg-white px-4 text-xs font-bold uppercase text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 transition active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-30 ml-auto sm:ml-0"
      >
        <span>Next Ep</span>
        <ChevronRightIcon className="size-4" />
      </button>
    </div>

    {/* Ad-Shield & Playback Tip */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] px-4 py-3 text-xs shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span className="mt-1 sm:mt-0 flex h-2.5 w-2.5 bg-black dark:bg-white shrink-0" />
        <p className="text-gray-700 dark:text-gray-300 font-medium leading-normal">
          <strong className="text-black dark:text-white font-bold uppercase tracking-wider mr-1">
            Ad-Shield Active:
          </strong>
          Pop-ups and redirects blocked. For cleanest playback, use{" "}
          <strong className="text-black dark:text-white font-semibold">Brave Browser</strong> or{" "}
          <strong className="text-black dark:text-white font-semibold">uBlock Origin</strong>.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 md:border-l-2 md:border-black dark:md:border-white md:pl-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span className="hidden md:inline">Tip:</span>
        <span>Switch server above if video is slow</span>
      </div>
    </div>

    {/* Timestamp / Checkpoint Bar */}
    <div className="flex flex-col gap-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900 p-3 sm:p-4 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black dark:text-white">
          <BookmarkIcon className="size-3.5" />
          <span>Bookmark:</span>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="Min"
            value={minutesInput}
            onChange={(e) => setMinutesInput(e.target.value)}
            aria-label="Bookmark minutes"
            className="h-8 w-14 border border-black dark:border-white bg-white dark:bg-[#111215] px-2 text-center text-xs font-bold text-black dark:text-white focus:outline-none"
          />
          <span className="text-black dark:text-white font-bold">:</span>
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
            className="h-8 w-14 border border-black dark:border-white bg-white dark:bg-[#111215] px-2 text-center text-xs font-bold text-black dark:text-white focus:outline-none"
          />
        </div>

        <button
          onClick={handleSaveTimestamp}
          className="h-8 flex-1 sm:flex-initial border border-black dark:border-white bg-black dark:bg-white px-4 text-xs font-bold uppercase tracking-wider text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] hover:bg-gray-800 dark:hover:bg-gray-200 active:translate-x-0.5 active:translate-y-0.5 transition"
        >
          Save Bookmark
        </button>
      </div>

      {savedTime > 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <span>Saved point:</span>
          <span className="border border-black dark:border-white bg-white dark:bg-black px-2 py-0.5 font-bold font-mono text-black dark:text-white">
            {formatTime(savedTime)}
          </span>
        </div>
      )}
    </div>

    {/* Episode Selection Section */}
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black dark:border-white pb-2">
        <h3 className="font-manga-title text-base sm:text-lg font-black text-black dark:text-white tracking-wide uppercase">
          Select Episode
        </h3>

        {/* Quick jump input */}
        {availableMaxEp > 12 && (
          <form onSubmit={handleJumpToEpisode} className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={availableMaxEp}
              placeholder="Ep #"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="h-7 w-16 border border-black dark:border-white bg-white dark:bg-[#111215] px-2 text-center text-xs font-bold text-black dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-7 border border-black dark:border-white bg-black dark:bg-white px-2.5 text-[11px] font-bold uppercase text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Go
            </button>
          </form>
        )}
      </div>

      {/* Airing Notice if unreleased episodes are pending */}
      {airedEpisodes && totalEpisodes && airedEpisodes < totalEpisodes && (
        <div className="flex items-center gap-2 border-1.5 border-black dark:border-white bg-gray-50 dark:bg-zinc-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span className="font-bold">Airing Notice:</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Episode {airedEpisodes} of {totalEpisodes} released. Episodes {airedEpisodes + 1}–{totalEpisodes} are upcoming and locked until broadcast.
          </span>
        </div>
      )}

      {/* Range Selector if anime has more than 1 chunk */}
      {chunkCount > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-gray-300 dark:border-zinc-700 pb-2">
          {/* Dropdown Range Picker (Responsive for Mobile and compact navigation) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 shrink-0">
              Range:
            </span>
            <div className="relative flex-1 sm:flex-initial min-w-[170px]">
              <select
                value={selectedChunk}
                onChange={(e) => setSelectedChunk(Number(e.target.value))}
                aria-label="Select Episode Range"
                className="h-8 w-full appearance-none border-2 border-black dark:border-white bg-white dark:bg-[#1a1b20] pl-3 pr-8 text-xs font-bold uppercase tracking-wider text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] focus:outline-none cursor-pointer"
              >
                {Array.from({ length: chunkCount }, (_, idx) => {
                  const start = idx * episodesPerChunk + 1;
                  const end = Math.min(start + episodesPerChunk - 1, effectiveMaxEp);
                  return (
                    <option
                      key={idx}
                      value={idx}
                      className="bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold py-1"
                    >
                      Episodes {start} – {end}
                    </option>
                  );
                })}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black dark:text-white">
                <ChevronDownIcon className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Quick-Access Pills for Tablet / Desktop (never wrap numbers) */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {Array.from({ length: chunkCount }, (_, idx) => {
              const start = idx * episodesPerChunk + 1;
              const end = Math.min(start + episodesPerChunk - 1, effectiveMaxEp);
              const isCurrent = selectedChunk === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedChunk(idx)}
                  className={`h-8 px-3 text-xs font-bold uppercase tracking-wider border-2 transition whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa]"
                      : "border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]"
                  }`}
                >
                  {start}–{end}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Episode Grid with responsive column layout */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-h-60 overflow-y-auto pr-1 sm:grid-cols-8 md:grid-cols-10">
        {chunkEpisodes.map((epNum) => {
          const isActive = epNum === episode;
          const isUnreleased = epNum > availableMaxEp;

          if (isUnreleased) {
            return (
              <button
                key={epNum}
                type="button"
                disabled
                title={`Episode ${epNum}: Not yet aired (${totalEpisodes} total planned for season)`}
                className="flex h-10 items-center justify-center text-xs font-bold border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-gray-100/60 dark:bg-zinc-800/30 text-gray-400 dark:text-gray-600 cursor-not-allowed select-none"
              >
                {epNum}
              </button>
            );
          }

          return (
            <button
              key={epNum}
              onClick={() => handleSelectEpisode(epNum)}
              className={`flex h-10 items-center justify-center text-xs font-bold transition-all border-2 ${
                isActive
                  ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#555555] dark:shadow-[2px_2px_0px_#aaaaaa] font-black scale-105"
                  : "border-black dark:border-white bg-white dark:bg-[#1a1b20] text-black dark:text-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] hover:bg-gray-100 dark:hover:bg-zinc-800 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
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
