// Jikan API v4 response types
// Keep strict – avoid `any`. Add new fields here rather than casting in place.

export type WatchStatus = "watching" | "planned" | "completed" | "dropped";

export interface Savepoint {
  mal_id: number;
  title: string;
  /** Stored poster URL so the library page needs zero API calls */
  image: string;
  status: WatchStatus;
  /** Last episode watched (0 = not started) */
  episode: number;
  /** Date.now() timestamp */
  updatedAt: number;
}

/** Record<mal_id, Savepoint> – the shape stored in localStorage */
export type SavepointStore = Record<number, Savepoint>;

// ---------------------------------------------------------------------------
// Jikan shared sub-types
// ---------------------------------------------------------------------------

export interface JikanImage {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanImages {
  jpg: JikanImage;
  webp?: JikanImage;
}

export interface JikanTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
}

export interface JikanGenre {
  mal_id: number;
  name: string;
  type: string;
  url: string;
}

export interface JikanStudio {
  mal_id: number;
  name: string;
  type: string;
  url: string;
}

export interface JikanAirDate {
  from: string | null;
  to: string | null;
}

// ---------------------------------------------------------------------------
// Main anime types
// ---------------------------------------------------------------------------

export interface AnimeBase {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: JikanImages;
  synopsis: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  episodes: number | null;
  status: string;
  type: string | null;
  genres: JikanGenre[];
  studios: JikanStudio[];
  aired: JikanAirDate;
  season: string | null;
  year: number | null;
}

/** Full anime – returned by /anime/{id}/full */
export interface AnimeFull extends AnimeBase {
  trailer: JikanTrailer;
  background: string | null;
  rating: string | null;
  duration: string | null;
  source: string | null;
  themes: JikanGenre[];
  demographics: JikanGenre[];
}

// ---------------------------------------------------------------------------
// Jikan response wrappers
// ---------------------------------------------------------------------------

export interface JikanPaginatedResponse<T> {
  data: T[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export interface JikanSingleResponse<T> {
  data: T;
}
