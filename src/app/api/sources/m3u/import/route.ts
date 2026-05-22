import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import { importM3UPlaylist, m3uImportSchema } from "@/lib/services/m3u";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const body = await request.json();
    const result = await importM3UPlaylist(m3uImportSchema.parse(body));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
