import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import { importTmdbMetadata, tmdbImportSchema } from "@/lib/services/tmdb";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const result = await importTmdbMetadata(tmdbImportSchema.parse(await request.json()));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
