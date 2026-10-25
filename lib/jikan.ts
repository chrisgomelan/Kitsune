/**
 * lib/jikan.ts
 * Typed fetch wrapper for the Jikan API v4.
 * All components and pages MUST use these helpers – no raw fetch to Jikan.
 */
import type {
  AnimeBase,
  AnimeFull,
  JikanPaginatedResponse,
  JikanSingleResponse,
} from "@/types/anime";

const BASE = "https://api.jikan.moe/v4";

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
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate },
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (!res.ok) {
    throw new Error(`Jikan error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /top/anime  (cached 1 h) */
export async function getTopAnime(limit = 12): Promise<AnimeBase[]> {
  const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
    "/top/anime",
    3600,
    { limit }
  );
  return data.data;
}

/** GET /seasons/now  (cached 1 h) */
export async function getSeasonalAnime(limit = 12): Promise<AnimeBase[]> {
  const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
    "/seasons/now",
    3600,
    { limit }
  );
  return data.data;
}

/** GET /anime?q=  (cached 10 min) */
export async function searchAnime(
  query: string,
  limit = 20
): Promise<AnimeBase[]> {
  const data = await jikanFetch<JikanPaginatedResponse<AnimeBase>>(
    "/anime",
    600,
    { q: query, sfw: true, limit }
  );
  return data.data;
}

/** GET /anime/{id}/full  (cached 24 h) */
export async function getAnimeFull(id: number): Promise<AnimeFull> {
  const data = await jikanFetch<JikanSingleResponse<AnimeFull>>(
    `/anime/${id}/full`,
    86400
  );
  return data.data;
}
