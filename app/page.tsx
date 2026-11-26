import MangaHomeView from "@/components/MangaHomeView";
import { getSeasonalAnime, getTopAnime } from "@/lib/jikan";

export default async function HomePage() {
  // Fetch initial top & seasonal anime for instant server-rendered performance
  const topAnime = await getTopAnime(15);
  const seasonal = await getSeasonalAnime(24);

  return <MangaHomeView topAnime={topAnime} seasonalAnime={seasonal} />;
}
