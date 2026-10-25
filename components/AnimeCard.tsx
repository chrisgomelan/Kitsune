import Image from "next/image";
import Link from "next/link";
import type { AnimeBase } from "@/types/anime";

interface AnimeCardProps {
  anime: AnimeBase;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const imageUrl = anime.images.jpg.image_url;
  const title = anime.title_english ?? anime.title;

  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-violet-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={`${title} poster`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Score badge */}
        {anime.score && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-yellow-400 backdrop-blur-sm">
            ★ {anime.score.toFixed(1)}
          </div>
        )}
        {/* Type badge */}
        {anime.type && (
          <div className="absolute left-2 top-2 rounded-full bg-violet-600/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {anime.type}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {title}
        </h3>
        <p className="text-xs text-white/50">
          {anime.episodes ? `${anime.episodes} eps` : "? eps"} ·{" "}
          {anime.status ?? "Unknown"}
        </p>
      </div>
    </Link>
  );
}
