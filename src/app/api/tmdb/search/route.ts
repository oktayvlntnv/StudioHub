import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import { searchTmdb, tmdbSearchSchema } from "@/lib/services/tmdb";

export async function GET(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const url = new URL(request.url);
    const result = await searchTmdb(
      tmdbSearchSchema.parse({
        query: url.searchParams.get("q"),
        mediaType: url.searchParams.get("type") ?? "movie",
      }),
    );
    return NextResponse.json({ results: result });
  } catch (error) {
    return handleApiError(error);
  }
}
