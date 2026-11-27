import { NextResponse } from "next/server";
import type { AnimeBase } from "@/types/anime";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

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
  description
  averageScore
  popularity
  episodes
  nextAiringEpisode {
    episode
    timeUntilAiring
    airingAt
  }
  status
  format
  genres
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
`;

function mapAniList(media: any): AnimeBase {
  const imageUrl =
    media.coverImage?.extraLarge ??
    media.coverImage?.large ??
    media.coverImage?.medium ??
    "https://cdn.myanimelist.net/images/anime/1015/138006.jpg";

  const malId = media.idMal ?? media.id;

  let formattedStatus = media.status ?? "Unknown";
  if (media.status === "FINISHED") formattedStatus = "Finished Airing";
  else if (media.status === "RELEASING") formattedStatus = "Currently Airing";
  else if (media.status === "NOT_YET_RELEASED") formattedStatus = "Not yet aired";

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
    synopsis: media.description?.replace(/<[^>]+>/g, "").trim() ?? null,
    score: media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : null,
    scored_by: media.popularity ?? 0,
    rank: null,
    episodes: media.episodes ?? null,
    aired_episodes:
      media.status === "FINISHED"
        ? (media.episodes ?? null)
        : media.status === "NOT_YET_RELEASED"
        ? 0
        : media.nextAiringEpisode?.episode
        ? Math.max(0, media.nextAiringEpisode.episode - 1)
        : (media.episodes ?? null),
    next_airing_episode: media.nextAiringEpisode ?? null,
    status: formattedStatus,
    type: media.format ?? "TV",
    genres: (media.genres ?? []).map((name: string, i: number) => ({
      mal_id: i + 1,
      name,
      type: "anime",
      url: "",
    })),
    studios: (media.studios?.nodes ?? []).map((s: any) => ({
      mal_id: s.id,
      name: s.name,
      type: "anime",
      url: "",
    })),
    aired: { from: null, to: null },
    season: null,
    year: null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim().toLowerCase();
  const genre = searchParams.get("genre")?.trim();
  const q = searchParams.get("q")?.trim();
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") ?? "24", 10) || 24;

  let query = "";
  let variables: Record<string, any> = { page, perPage: limit };

  if (q) {
    query = `
      query SearchAnime($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    variables.search = q;
  } else if (genre) {
    query = `
      query GetAnimeByGenre($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    variables.genre = genre;
  } else if (type === "top") {
    query = `
      query GetTopAnime($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: SCORE_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
  } else if (type === "seasonal") {
    query = `
      query GetSeasonalAnime($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
  } else {
    // popular by default
    query = `
      query GetPopularAnime($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
  }

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Kitsune/1.0",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`AniList returned status ${res.status}`);
    }

    const data = await res.json();
    const mediaList = data.data?.Page?.media ?? [];
    const results: AnimeBase[] = mediaList.map(mapAniList);

    return NextResponse.json({
      results,
      page,
      hasMore: results.length >= limit,
    });
  } catch (error: any) {
    console.error("[api] catalog fetch error:", error);
    return NextResponse.json(
      { results: [], page, hasMore: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
