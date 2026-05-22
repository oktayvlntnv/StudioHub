import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import { importXtreamMovies, xtreamSourceIdSchema } from "@/lib/services/xtream";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const { sourceId } = xtreamSourceIdSchema.parse(await request.json());
    const result = await importXtreamMovies(sourceId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
