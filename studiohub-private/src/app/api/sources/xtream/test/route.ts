import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import { testConnection, xtreamSourceIdSchema } from "@/lib/services/xtream";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const body = await request.json();
    const result = await testConnection(xtreamSourceIdSchema.parse(body));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
