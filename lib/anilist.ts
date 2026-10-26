/**
 * lib/anilist.ts
 * High-performance AniList GraphQL client that maps directly into Kitsune's AnimeBase / AnimeFull types.
 * Provides 99.9% uptime, no API key required, fast responses, and rich metadata.
 */
import type { AnimeBase, AnimeFull } from "@/types/anime";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  } | null;
  bannerImage?: string | null;
  description?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  status?: string | null;
  format?: string | null;
  genres?: string[] | null;
  studios?: {
    nodes?: Array<{ id: number; name: string }>;
  } | null;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  season?: string | null;
  seasonYear?: number | null;
  trailer?: {
    id?: string | null;
    site?: string | null;
  } | null;
  source?: string | null;
  duration?: number | null;
}

function formatDate(dateObj?: { year?: number | null; month?: number | null; day?: number | null } | null): string | null {
  if (!dateObj || !dateObj.year) return null;
  const y = dateObj.year;
  const m = dateObj.month ? String(dateObj.month).padStart(2, "0") : "01";
  const d = dateObj.day ? String(dateObj.day).padStart(2, "0") : "01";
  return `${y}-${m}-${d}`;
}

function formatStatus(status?: string | null): string {
  switch (status) {
    case "FINISHED":
      return "Finished Airing";
    case "RELEASING":
      return "Currently Airing";
    case "NOT_YET_RELEASED":
      return "Not yet aired";
    case "CANCELLED":
      return "Cancelled";
    case "HIATUS":
      return "On Hiatus";
    default:
      return status ?? "Unknown";
  }
}

function cleanSynopsis(raw?: string | null): string | null {
  if (!raw) return null;
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function mapAniListToAnimeBase(media: AniListMedia): AnimeBase {
  const imageUrl =
    media.coverImage?.extraLarge ??
    media.coverImage?.large ??
    media.coverImage?.medium ??
    "https://cdn.myanimelist.net/images/anime/1015/138006.jpg";

  const malId = media.idMal ?? media.id;

  return {
    mal_id: malId,
    anilist_id: media.id,
    title: media.title.romaji || media.title.english || "Unknown Title",
    title_english: media.title.english || media.title.romaji || null,
    images: {
      jpg: {
        image_url: imageUrl,
        small_image_url: media.coverImage?.medium ?? imageUrl,
        large_image_url: media.coverImage?.extraLarge ?? media.coverImage?.large ?? imageUrl,
      },
    },
    synopsis: cleanSynopsis(media.description),
    score: media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : null,
    scored_by: media.popularity ?? 0,
    rank: null,
    episodes: media.episodes ?? null,
    status: formatStatus(media.status),
    type: media.format ?? "TV",
    genres: (media.genres ?? []).map((name, i) => ({
      mal_id: i + 1,
      name,
      type: "anime",
      url: "",
    })),
    studios: (media.studios?.nodes ?? []).map((s) => ({
      mal_id: s.id,
      name: s.name,
      type: "anime",
      url: "",
    })),
    aired: {
      from: formatDate(media.startDate),
      to: formatDate(media.endDate),
    },
    season: media.season?.toLowerCase() ?? null,
    year: media.seasonYear ?? media.startDate?.year ?? null,
  };
}

export function mapAniListToAnimeFull(media: AniListMedia): AnimeFull {
  const base = mapAniListToAnimeBase(media);
  const trailerId = media.trailer?.site === "youtube" ? media.trailer.id : null;

  return {
    ...base,
    trailer: {
      youtube_id: trailerId ?? null,
      url: trailerId ? `https://youtu.be/${trailerId}` : null,
      embed_url: trailerId ? `https://www.youtube.com/embed/${trailerId}` : null,
    },
    background: media.bannerImage ?? null,
    rating: null,
    duration: media.duration ? `${media.duration} min per ep` : null,
    source: media.source ?? "Original",
    themes: [],
    demographics: [],
  };
}

async function anilistRequest<T>(query: string, variables: Record<string, unknown>, revalidate = 3600): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Kitsune/1.0",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`AniList GraphQL Error: ${json.errors[0]?.message || "Unknown error"}`);
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Public AniList API
// ---------------------------------------------------------------------------

const MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  description
  averageScore
  popularity
  episodes
  status
  format
  genres
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  season
  seasonYear
  trailer {
    id
    site
  }
  source
  duration
`;

/** Top anime by score */
export async function fetchTopAnimeFromAniList(limit = 12): Promise<AnimeBase[]> {
  const query = `
    query GetTopAnime($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  interface Response {
    Page: {
      media: AniListMedia[];
    };
  }

  const data = await anilistRequest<Response>(query, { perPage: limit }, 3600);
  return data.Page.media.map(mapAniListToAnimeBase);
}

/** Currently airing seasonal anime by popularity */
export async function fetchSeasonalAnimeFromAniList(limit = 12): Promise<AnimeBase[]> {
  const query = `
    query GetSeasonalAnime($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  interface Response {
    Page: {
      media: AniListMedia[];
    };
  }

  const data = await anilistRequest<Response>(query, { perPage: limit }, 3600);
  return data.Page.media.map(mapAniListToAnimeBase);
}

/** Search anime by title */
export async function searchAnimeFromAniList(queryText: string, limit = 20): Promise<AnimeBase[]> {
  const query = `
    query SearchAnime($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  interface Response {
    Page: {
      media: AniListMedia[];
    };
  }

  const data = await anilistRequest<Response>(query, { search: queryText, perPage: limit }, 600);
  return data.Page.media.map(mapAniListToAnimeBase);
}

/** Fetch anime by genre sorted by popularity */
export async function fetchAnimeByGenreFromAniList(genre: string, limit = 18): Promise<AnimeBase[]> {
  const query = `
    query GetAnimeByGenre($genre: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  interface Response {
    Page: {
      media: AniListMedia[];
    };
  }

  const data = await anilistRequest<Response>(query, { genre, perPage: limit }, 3600);
  return data.Page.media.map(mapAniListToAnimeBase);
}

/** Get full anime details by ID (matches idMal or AniList id) */
export async function fetchAnimeFullFromAniList(id: number): Promise<AnimeFull> {
  // First attempt query by idMal (MyAnimeList ID)
  const queryWithMal = `
    query GetAnimeByIdMal($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `;

  interface SingleResponse {
    Media: AniListMedia | null;
  }

  try {
    const data = await anilistRequest<SingleResponse>(queryWithMal, { idMal: id }, 86400);
    if (data.Media) {
      return mapAniListToAnimeFull(data.Media);
    }
  } catch {
    // If not found by idMal, fallback to querying by AniList id
  }

  const queryWithId = `
    query GetAnimeById($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `;

  const fallbackData = await anilistRequest<SingleResponse>(queryWithId, { id }, 86400);
  if (!fallbackData.Media) {
    throw new Error(`Anime with ID ${id} not found on AniList.`);
  }

  return mapAniListToAnimeFull(fallbackData.Media);
}
