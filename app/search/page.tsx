import type { Metadata } from "next";
import AnimeCard from "@/components/AnimeCard";
import { searchAnime } from "@/lib/jikan";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search Anime",
    description: q
      ? `Search results for "${q}" on Kitsune.`
      : "Search for anime on Kitsune.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg text-white/50">Enter a search query to get started.</p>
      </div>
    );
  }

  const results = await searchAnime(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Results for <span className="text-violet-300">"{query}"</span>
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {results.length} anime found
        </p>
      </header>

      {results.length === 0 ? (
        <p className="text-white/50">No results found. Try a different search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}
