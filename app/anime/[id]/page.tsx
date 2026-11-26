import type { Metadata } from "next";
import Image from "next/image";
import { getAnimeFull } from "@/lib/jikan";
import SaveButton from "@/components/SaveButton";
import WatchPlayer from "@/components/WatchPlayer";
import { StarIcon } from "@/components/Icons";
import { JaggedShoutBubble } from "@/components/MangaSpeechBubbles";

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
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* ── Main Details Header Panel ── */}
      <div className="relative bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        {/* Poster with Manga Ink border - centered on mobile */}
        <div className="relative mx-auto h-72 w-52 sm:h-80 sm:w-56 flex-shrink-0 overflow-hidden border-2 border-black dark:border-white shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] md:mx-0 md:h-[380px] md:w-64 bg-gray-100 dark:bg-zinc-800">
          <Image
            src={imageUrl}
            alt={`${title} poster`}
            fill
            className="object-cover manga-grayscale-img"
            priority
            sizes="(max-width: 768px) 220px, 256px"
          />
          {/* Sticker */}
          <div className="absolute -bottom-2.5 -right-2 z-10 w-24 sm:w-28">
            <JaggedShoutBubble text="INFO" />
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-1 flex-col gap-3.5 sm:gap-4">
          {/* Title & Metadata */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Anime Profile
            </span>
            <h1 className="font-manga-title text-xl sm:text-3xl md:text-4xl font-black leading-tight tracking-wide text-black dark:text-white uppercase">
              {title}
            </h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">{anime.title}</p>
            )}

            {/* Studio & Season Line */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {anime.studios.length > 0 && (
                <span>
                  Studio: <strong className="text-black dark:text-white">{anime.studios.map((s) => s.name).join(", ")}</strong>
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
              <div className="mt-3 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <span
                    key={g.mal_id}
                    className="border-1.5 border-black dark:border-white bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black dark:text-white shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <StatCard
              label="Rating"
              value={anime.score ? `★ ${anime.score.toFixed(1)}` : "—"}
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

          {/* Watch Status & Save Progress Card */}
          <div className="pt-2">
            <SaveButton
              mal_id={anime.mal_id}
              title={title}
              image={anime.images.jpg.image_url}
              totalEpisodes={anime.episodes}
            />
          </div>
        </div>
      </div>

      {/* ── Watch Player ── */}
      <section aria-label="Watch Episodes">
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
        <section aria-labelledby="synopsis-heading" className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] space-y-2">
          <h2 id="synopsis-heading" className="font-manga-title text-base sm:text-xl font-black text-black dark:text-white tracking-wide uppercase">
            Story Summary
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line font-medium">
            {anime.synopsis}
          </p>
        </section>
      )}

      {/* ── Trailer ── */}
      {anime.trailer.embed_url && (
        <section aria-labelledby="trailer-heading" className="bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white p-3.5 sm:p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] space-y-3">
          <h2 id="trailer-heading" className="font-manga-title text-base sm:text-xl font-black text-black dark:text-white tracking-wide uppercase">
            Official Preview Video
          </h2>
          <div className="relative aspect-video overflow-hidden border-2 border-black dark:border-white bg-black">
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-1.5 border-black dark:border-white bg-gray-50 dark:bg-zinc-800 p-2 text-center shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="mt-0.5 text-xs font-black text-black dark:text-white truncate max-w-full">
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
