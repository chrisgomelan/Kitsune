import { KitsuneLogo } from "@/components/Icons";
import HomeGenreSection from "@/components/HomeGenreSection";
import { getSeasonalAnime, getTopAnime } from "@/lib/jikan";

export default async function HomePage() {
  // Fetch initial top & seasonal anime for instant server-rendered performance
  const topAnime = await getTopAnime(12);
  const seasonal = await getSeasonalAnime(12);

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-900/60 via-indigo-900/40 to-[#0b0c14] px-4 py-7 sm:px-8 sm:py-11 text-center ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,transparent_70%)]" />
        <div className="relative flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30 shadow-lg shadow-violet-950/50">
            <KitsuneLogo className="size-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Kitsune
          </h1>
          <p className="mt-2 max-w-md mx-auto text-sm sm:text-base text-white/70">
            Track anime & resume anytime — no account needed.
          </p>
        </div>
      </section>

      {/* Category / Genre Selector & Anime Sections */}
      <HomeGenreSection
        initialTopAnime={topAnime}
        initialSeasonalAnime={seasonal}
      />
    </div>
  );
}
