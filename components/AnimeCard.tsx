import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/components/Icons";
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
      className="group relative flex flex-col overflow-hidden bg-white dark:bg-[#1a1b20] border-2 border-black dark:border-white/80 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] hover:shadow-[5px_5px_0px_#000000] dark:hover:shadow-[5px_5px_0px_#ffffff] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
    >
      {/* Poster with Manga Ink Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden border-b-2 border-black dark:border-white/80 bg-gray-100 dark:bg-zinc-800">
        <Image
          src={imageUrl}
          alt={`${title} cover`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105 manga-grayscale-img"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
        />

        {/* Score badge - Comic sticker style */}
        {anime.score && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1 border-1.5 border-black dark:border-white bg-white dark:bg-black px-1.5 py-0.5 text-[11px] font-black text-black dark:text-white shadow-[1.5px_1.5px_0px_#000000] dark:shadow-[1.5px_1.5px_0px_#ffffff]">
            <StarIcon className="size-3 text-black dark:text-amber-400 fill-black dark:fill-amber-400" />
            <span>{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Type badge */}
        {anime.type && (
          <div className="absolute left-1.5 top-1.5 border-1.5 border-black dark:border-white bg-black dark:bg-white px-1.5 py-0.5 text-[10px] font-black uppercase text-white dark:text-black shadow-[1.5px_1.5px_0px_#ffffff] dark:shadow-[1.5px_1.5px_0px_#000000]">
            {anime.type}
          </div>
        )}
      </div>

      {/* Info Section - Clean, responsive, non-technical */}
      <div className="flex flex-1 flex-col justify-between p-2 sm:p-2.5 bg-white dark:bg-[#1a1b20]">
        <div>
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-tight text-black dark:text-white group-hover:underline">
            {title}
          </h3>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 border-t border-dashed border-gray-300 dark:border-zinc-700 pt-1 sm:pt-1.5">
          <span>
            {anime.aired_episodes && anime.episodes && anime.aired_episodes < anime.episodes
              ? `Ep ${anime.aired_episodes} / ${anime.episodes}`
              : anime.episodes
                ? `${anime.episodes} eps`
                : "Airing"}
          </span>
          <span className="truncate max-w-[70px] sm:max-w-[100px] text-right">{anime.status ?? "Available"}</span>
        </div>
      </div>
    </Link>
  );
}
