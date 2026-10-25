# Project Context: Anime Watch Tracker

## Overview
A personal anime watch tracker. Users browse anime (top, seasonal, search), open a details page, and save their progress ("savepoint") per anime. There is **no backend and no accounts**. All user data lives in the browser's `localStorage`.

**Project name:** Kitsune

## Goals
- Discover anime via the Jikan API.
- Track status and last watched episode per anime.
- Resume quickly from a "Continue watching" library.
- Export/import savepoints as JSON for backup.

## Non-goals
- No video streaming or scraping streaming sources (legal risk, unreliable). Trailers only, via Jikan's `trailer.embed_url`.
- No authentication, database, or server-side user data.
- No cross-device sync (for now).

## Tech Stack
- **Next.js** (App Router) with **TypeScript**
- **Tailwind CSS** for styling
- **Jikan API v4** (`https://api.jikan.moe/v4`), no API key
- **localStorage** for persistence
- `next/image` for posters (remote pattern: `cdn.myanimelist.net`)

## Project Structure
```
app/
  page.tsx                 Home: top + seasonal sections (server component)
  search/page.tsx          Search results (uses searchParams)
  anime/[id]/page.tsx      Details page (server component, generateMetadata)
  library/page.tsx         Savepoint library (client component)
  error.tsx                Friendly error UI (handles rate limits)
components/
  SaveButton.tsx           Client: start/update/remove savepoint
  BackupButtons.tsx        Client: export/import JSON
lib/
  jikan.ts                 Typed fetch wrapper for Jikan
  savepoints.ts            useSavepoints() hook (localStorage)
types/
  anime.ts                 Jikan response types
```

## Data Model
```ts
type WatchStatus = "watching" | "planned" | "completed" | "dropped";

interface Savepoint {
  mal_id: number;
  title: string;
  image: string;       // stored so the library needs zero API calls
  status: WatchStatus;
  episode: number;     // last episode watched
  updatedAt: number;   // Date.now()
}
```
- Storage key: `savepoints:v1`
- Shape: `Record<number, Savepoint>` keyed by `mal_id`
- If the shape changes, bump the key to `v2` and write a migration.

## Architecture Rules
1. **Server components by default.** Only add `"use client"` for anything touching `localStorage`, hooks, or event handlers.
2. **Never read `localStorage` during render.** Read it in `useEffect` and gate UI behind a `ready` flag to avoid hydration mismatches.
3. **All Jikan calls go through `lib/jikan.ts`.** No raw `fetch` to Jikan in components or pages.
4. **Wrap every `localStorage` access in try/catch** (private mode, quota, corrupted JSON).
5. **Keep savepoints in sync** across hook instances and tabs: `persist()` dispatches a `savepoints:change` event, and the hook also listens to `storage`.
6. The library page must **not** call Jikan. It renders from stored savepoint data only.

## Jikan API Guidelines
- Rate limit: about **3 requests/second, 60/minute**. Avoid parallel fetches on one page; keep home page sections few.
- Cache with `fetch(..., { next: { revalidate } })`:
  - Top/seasonal lists: `3600`
  - Search: `600`
  - Details: `86400`
- Handle `429` with a clear error and let `error.tsx` show a friendly retry message.
- Use `sfw=true` on search.
- Use `/anime/{id}/full` for details.
- Footer must credit **MyAnimeList** as the data source.

Common endpoints: `/top/anime`, `/seasons/now`, `/anime?q=`, `/anime/{id}/full`, `/schedules`.

## Conventions
- TypeScript strict; avoid `any` (define Jikan types in `types/anime.ts`).
- Path alias `@/` for imports.
- Tailwind utility classes; no CSS modules.
- Next 15+ App Router: `params` and `searchParams` are **Promises**, so `await` them.
- Use `next/image` with explicit `width`/`height` for posters.
- Add `generateMetadata` on dynamic pages (title, description, Open Graph image).
- Prefer small, single-purpose components; accessible buttons (labels, focus states).

## Commands
```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Config Reminder
```js
// next.config.ts
module.exports = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.myanimelist.net" }],
  },
};
```

## Known Limitations
- Data is per-browser; clearing site data loses savepoints (hence Export/Import).
- Jikan is unofficial and can be slow or rate-limited.

## Instructions for the AI Assistant
- Follow the architecture rules above; ask before adding a backend, database, or new dependency.
- Do not add streaming or scraping features.
- When changing the savepoint shape, update the type, the storage key version, and the import validation together.
- Keep responses and diffs minimal and focused on the requested change.
