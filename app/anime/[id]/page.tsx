import type { Metadata } from "next";
import Image from "next/image";
import { getAnimeFull } from "@/lib/jikan";
import SaveButton from "@/components/SaveButton";
import WatchPlayer from "@/components/WatchPlayer";

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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="relative mx-auto h-80 w-56 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 md:mx-0 md:h-96 md:w-64">
          <Image
            src={imageUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 224px, 256px"
          />
        </div>

        <div className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight text-white">{title}</h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <p className="mt-1 text-base text-white/40">{anime.title}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill label="Score" value={anime.score ? `★ ${anime.score}` : "—"} />
            <Pill label="Episodes" value={anime.episodes?.toString() ?? "?"} />
            <Pill label="Status" value={anime.status} />
            <Pill label="Type" value={anime.type ?? "—"} />
            {anime.season && anime.year && (
              <Pill label="Season" value={`${capitalize(anime.season)} ${anime.year}`} />
            )}
          </div>

          {anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <span
                  key={g.mal_id}
                  className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {anime.studios.length > 0 && (
            <p className="text-sm text-white/50">
              Studio:{" "}
              <span className="text-white/80">
                {anime.studios.map((s) => s.name).join(", ")}
              </span>
            </p>
          )}

          <div className="mt-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Your Progress
            </h2>
            <SaveButton
              mal_id={anime.mal_id}
              title={title}
              image={anime.images.jpg.image_url}
              totalEpisodes={anime.episodes}
            />
          </div>
        </div>
      </div>

      {/* Watch Player */}
      <section aria-labelledby="watch-heading">
        <WatchPlayer
          mal_id={anime.mal_id}
          title={title}
          image={imageUrl}
          totalEpisodes={anime.episodes}
        />
      </section>

      {anime.synopsis && (
        <section className="mt-10" aria-labelledby="synopsis-heading">
          <h2 id="synopsis-heading" className="mb-3 text-lg font-bold text-white">
            Synopsis
          </h2>
          <p className="leading-relaxed text-white/70">{anime.synopsis}</p>
        </section>
      )}

      {anime.trailer.embed_url && (
        <section className="mt-10" aria-labelledby="trailer-heading">
          <h2 id="trailer-heading" className="mb-3 text-lg font-bold text-white">
            Trailer
          </h2>
          <div className="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-white/10">
            <iframe
              src={anime.trailer.embed_url}
              title={`${title} trailer`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}