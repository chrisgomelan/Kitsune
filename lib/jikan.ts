/**
 * lib/jikan.ts
 * Typed fetch wrapper for the Jikan API v4.
 * All components and pages MUST use these helpers – no raw fetch to Jikan.
 *
 * Offline fallback: set JIKAN_MOCK=true in .env.local to always use mock data,
 * or the functions will auto-fall back to mock data on any network error.
 */
import type {
  AnimeBase,
  AnimeFull,
  JikanPaginatedResponse,
  JikanSingleResponse,
} from "@/types/anime";
import {
  MOCK_ANIME_FULL,
  MOCK_SEASONAL_ANIME,
  MOCK_TOP_ANIME,
} from "@/lib/mock-data";

const BASE = "https://api.jikan.moe/v4";
const USE_MOCK = process.env.JIKAN_MOCK === "true";

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function jikanFetch<T>(
  path: string,
  revalidate: number,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }

  const res = await fetch(url.toString(), { next: { revalidate } });

  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`Jikan error ${res.status}: ${path}`);

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /top/anime  (cached 1 h) */
export async function getTopAnime(limit = 12): Promise<AnimeBase[]> {
  if (USE_MOCK) return MOCK_TOP_ANIME.slice(0, limit);
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/top/anime",
      3600,
      { limit }
    );
    return data.data;
  } catch {
    console.warn("[jikan] getTopAnime: API unreachable, using mock data");
    return MOCK_TOP_ANIME.slice(0, limit);
  }
}

/** GET /seasons/now  (cached 1 h) */
export async function getSeasonalAnime(limit = 12): Promise<AnimeBase[]> {
  if (USE_MOCK) return MOCK_SEASONAL_ANIME.slice(0, limit);
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/seasons/now",
      3600,
      { limit }
    );
    return data.data;
  } catch {
    console.warn("[jikan] getSeasonalAnime: API unreachable, using mock data");
    return MOCK_SEASONAL_ANIME.slice(0, limit);
  }
}

/** GET /anime?q=  (cached 10 min) */
export async function searchAnime(
  query: string,
  limit = 20
): Promise<AnimeBase[]> {
  if (USE_MOCK) {
    const q = query.toLowerCase();
    return [...MOCK_TOP_ANIME, ...MOCK_SEASONAL_ANIME]
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.title_english ?? "").toLowerCase().includes(q)
      )
      .slice(0, limit);
  }
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/anime",
      600,
      { q: query, sfw: true, limit }
    );
    return data.data;
  } catch {
    console.warn("[jikan] searchAnime: API unreachable, using mock data");
    const q = query.toLowerCase();
    return [...MOCK_TOP_ANIME, ...MOCK_SEASONAL_ANIME]
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.title_english ?? "").toLowerCase().includes(q)
      )
      .slice(0, limit);
  }
}

/** GET /anime/{id}/full  (cached 24 h) */
export async function getAnimeFull(id: number): Promise<AnimeFull> {
  if (USE_MOCK) {
    return getMockFull(id);
  }
  try {
    const data = await jikanFetch<JikanSingleResponse<AnimeFull>>(
      `/anime/${id}/full`,
      86400
    );
    return data.data;
  } catch {
    console.warn(`[jikan] getAnimeFull(${id}): API unreachable, using mock data`);
    return getMockFull(id);
  }
}

// ---------------------------------------------------------------------------
// Mock helper
// ---------------------------------------------------------------------------

function getMockFull(id: number): AnimeFull {
  if (MOCK_ANIME_FULL[id]) return MOCK_ANIME_FULL[id];

  // Build a generic full entry from base mock lists
  const base =
    [...MOCK_TOP_ANIME, ...MOCK_SEASONAL_ANIME].find((a) => a.mal_id === id) ??
    MOCK_TOP_ANIME[0];

  return {
    ...base,
    trailer: { youtube_id: null, url: null, embed_url: null },
    background: null,
    rating: "PG-13",
    duration: "24 min per ep",
    source: "Manga",
    themes: [],
    demographics: [],
  };
}

