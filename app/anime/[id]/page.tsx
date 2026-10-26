import type { Metadata } from "next";
import Image from "next/image";
import { getAnimeFull } from "@/lib/jikan";
import SaveButton from "@/components/SaveButton";
import WatchPlayer from "@/components/WatchPlayer";
import { StarIcon } from "@/components/Icons";

interface AnimeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeFull(Number(id));
  const title = anime.title_english ?? anime.title;
  return {
    title,
    description: anime.synopsis?.slice(0, 155) ?? `Details for ${title}.`,
    openGraph: {
      title,
      description: anime.synopsis?.slice(0, 155) ?? "",
      images: [anime.images.jpg.large_image_url ?? anime.images.jpg.image_url],
    },
  };
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params;
  const anime = await getAnimeFull(Number(id));
  const title = anime.title_english ?? anime.title;
  const imageUrl = anime.images.jpg.large_image_url ?? anime.images.jpg.image_url;

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 sm:py-10 space-y-8 sm:space-y-10">
      {/* ── Main Details Header ── */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Poster */}
        <div className="relative mx-auto h-80 w-56 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/15 md:mx-0 md:h-[390px] md:w-64">
          <Image
            src={imageUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 224px, 256px"
          />
        </div>

        {/* Info Column */}
        <div className="flex flex-1 flex-col gap-5">
          {/* Title & Metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white">
              {title}
            </h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <p className="mt-1 text-sm sm:text-base text-white/50">{anime.title}</p>
            )}

            {/* Studio & Season Line */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-medium text-white/60">
              {anime.studios.length > 0 && (
                <span>
                  Studio <strong className="text-white/80">{anime.studios.map((s) => s.name).join(", ")}</strong>
                </span>
              )}
              {anime.studios.length > 0 && anime.season && <span>•</span>}
              {anime.season && anime.year && (
                <span>
                  {capitalize(anime.season)} {anime.year}
                </span>
              )}
            </div>

            {/* Genre Pills */}
            {anime.genres.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <span
                    key={g.mal_id}
                    className="rounded-lg bg-violet-600/15 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/25"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Specs Grid - Clean, aligned, uniform */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              label="Score"
              value={anime.score ? anime.score.toFixed(1) : "—"}
              icon={anime.score ? <StarIcon className="size-3.5 text-amber-400" /> : undefined}
            />
            <StatCard
              label="Episodes"
              value={anime.episodes ? `${anime.episodes} eps` : "Airing"}
            />
            <StatCard
              label="Format"
              value={anime.type ?? "TV"}
            />
            <StatCard
              label="Status"
              value={anime.status ?? "—"}
            />
          </div>

          {/* Watch Status & Progress Card */}
          <SaveButton
            mal_id={anime.mal_id}
            title={title}
            image={anime.images.jpg.image_url}
            totalEpisodes={anime.episodes}
          />
        </div>
      </div>

      {/* ── Watch Player ── */}
      <section aria-labelledby="watch-heading">
        <WatchPlayer
          mal_id={anime.mal_id}
          anilist_id={anime.anilist_id}
          title={title}
          image={imageUrl}
          totalEpisodes={anime.episodes}
        />
      </section>

      {/* ── Synopsis ── */}
      {anime.synopsis && (
        <section aria-labelledby="synopsis-heading" className="space-y-3 rounded-2xl bg-white/[0.02] p-5 sm:p-6 ring-1 ring-white/10">
          <h2 id="synopsis-heading" className="text-base sm:text-lg font-bold text-white">
            Synopsis
          </h2>
          <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line sm:text-base">
            {anime.synopsis}
          </p>
        </section>
      )}

      {/* ── Trailer ── */}
      {anime.trailer.embed_url && (
        <section aria-labelledby="trailer-heading" className="space-y-3">
          <h2 id="trailer-heading" className="text-base sm:text-lg font-bold text-white">
            Trailer
          </h2>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            <iframe
              src={anime.trailer.embed_url}
              title={`${title} trailer`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white/[0.04] p-3 text-center ring-1 ring-white/10">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </span>
      <span className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-white">
        {icon}
        <span className="truncate max-w-full">{value}</span>
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}