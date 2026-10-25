import AnimeCard from "@/components/AnimeCard";
import { getSeasonalAnime, getTopAnime } from "@/lib/jikan";

export default async function HomePage() {
  // Sequential fetches to respect Jikan rate limits
  const topAnime = await getTopAnime(12);
  const seasonal = await getSeasonalAnime(12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/60 via-indigo-900/40 to-[#0b0c14] px-8 py-14 text-center ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,transparent_70%)]" />
        <h1 className="relative text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          🦊 Kitsune
        </h1>
        <p className="relative mt-4 max-w-xl mx-auto text-lg text-white/60">
          Your personal anime tracker. Save your progress, continue watching, and
          discover new favourites — all stored locally, no account needed.
        </p>
      </section>

      {/* Top Anime */}
      <section aria-labelledby="top-anime-heading">
        <SectionHeader id="top-anime-heading" label="🏆 Top Anime" />
        <AnimeGrid items={topAnime} />
      </section>

      {/* Seasonal */}
      <section aria-labelledby="seasonal-heading">
        <SectionHeader id="seasonal-heading" label="🌸 Airing This Season" />
        <AnimeGrid items={seasonal} />
      </section>
    </div>
  );
}

function SectionHeader({ id, label }: { id: string; label: string }) {
  return (
    <h2
      id={id}
      className="mb-5 text-xl font-bold text-white after:ml-3 after:text-white/20"
    >
      {label}
    </h2>
  );
}

function AnimeGrid({ items }: { items: Parameters<typeof AnimeCard>[0]["anime"][] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((anime) => (
        <AnimeCard key={anime.mal_id} anime={anime} />
      ))}
    </div>
  );
}
