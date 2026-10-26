import { NextResponse } from "next/server";
import { getAnimeByGenre } from "@/lib/jikan";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();

  if (!name || name === "All") {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await getAnimeByGenre(name, 18);
    return NextResponse.json({ results: results || [] });
  } catch (error) {
    console.warn("[api] genre fetch error, returning empty list:", error);
    return NextResponse.json({ results: [] });
  }
}
