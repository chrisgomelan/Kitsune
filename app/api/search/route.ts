import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/jikan";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAnime(q, 6);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[api] AJAX search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
