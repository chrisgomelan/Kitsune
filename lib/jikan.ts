/**
 * lib/jikan.ts
 * Unified anime API layer powered primarily by AniList GraphQL for 99.9% uptime,
 * with fallback to Jikan v4 and offline mock data.
 *
 * Keeps all function signatures identical so components require zero changes.
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
import {
  fetchTopAnimeFromAniList,
  fetchSeasonalAnimeFromAniList,
  searchAnimeFromAniList,
  fetchAnimeFullFromAniList,
} from "@/lib/anilist";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const USE_MOCK = process.env.JIKAN_MOCK === "true";

// ---------------------------------------------------------------------------
// Jikan fetcher (fallback)
// ---------------------------------------------------------------------------

async function jikanFetch<T>(
  path: string,
  revalidate: number,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`${JIKAN_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Kitsune/1.0",
      Accept: "application/json",
    },
    next: { revalidate },
    signal: AbortSignal.timeout(5000),
  });

  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`Jikan error ${res.status}: ${path}`);

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET top anime (cached 1 h) */
export async function getTopAnime(limit = 12): Promise<AnimeBase[]> {
  if (USE_MOCK) return MOCK_TOP_ANIME.slice(0, limit);

  // 1. Try AniList (Primary)
  try {
    const list = await fetchTopAnimeFromAniList(limit);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn("[api] AniList getTopAnime failed, trying Jikan fallback:", err);
  }

  // 2. Try Jikan (Secondary)
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/top/anime",
      3600,
      { limit }
    );
    return data.data;
  } catch {
    console.warn("[api] getTopAnime: All APIs unreachable, using offline mock data");
    return MOCK_TOP_ANIME.slice(0, limit);
  }
}

/** GET seasonal anime (cached 1 h) */
export async function getSeasonalAnime(limit = 12): Promise<AnimeBase[]> {
  if (USE_MOCK) return MOCK_SEASONAL_ANIME.slice(0, limit);

  // 1. Try AniList (Primary)
  try {
    const list = await fetchSeasonalAnimeFromAniList(limit);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn("[api] AniList getSeasonalAnime failed, trying Jikan fallback:", err);
  }

  // 2. Try Jikan (Secondary)
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/seasons/now",
      3600,
      { limit }
    );
    return data.data;
  } catch {
    console.warn("[api] getSeasonalAnime: All APIs unreachable, using offline mock data");
    return MOCK_SEASONAL_ANIME.slice(0, limit);
  }
}

/** Search anime by query (cached 10 min) */
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

  // 1. Try AniList (Primary)
  try {
    const list = await searchAnimeFromAniList(query, limit);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn("[api] AniList searchAnime failed, trying Jikan fallback:", err);
  }

  // 2. Try Jikan (Secondary)
  try {
    const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
      "/anime",
      600,
      { q: query, sfw: true, limit }
    );
    return data.data;
  } catch {
    console.warn("[api] searchAnime: All APIs unreachable, using offline mock data");
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

/** GET full anime details by ID (cached 24 h) */
export async function getAnimeFull(id: number): Promise<AnimeFull> {
  if (USE_MOCK) {
    return getMockFull(id);
  }

  // 1. Try AniList (Primary)
  try {
    const anime = await fetchAnimeFullFromAniList(id);
    if (anime) return anime;
  } catch (err) {
    console.warn(`[api] AniList getAnimeFull(${id}) failed, trying Jikan fallback:`, err);
  }

  // 2. Try Jikan (Secondary)
  try {
    const data = await jikanFetch<JikanSingleResponse<AnimeFull>>(
      `/anime/${id}/full`,
      86400
    );
    return data.data;
  } catch {
    console.warn(`[api] getAnimeFull(${id}): All APIs unreachable, using offline mock data`);
    return getMockFull(id);
  }
}

// ---------------------------------------------------------------------------
// Mock helper
// ---------------------------------------------------------------------------

function getMockFull(id: number): AnimeFull {
  if (MOCK_ANIME_FULL[id]) return MOCK_ANIME_FULL[id];

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
