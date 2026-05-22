import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireOwnerSession } from "@/lib/auth/owner";
import {
  legalDiscoverySearchSchema,
  searchLegalContent,
} from "@/lib/services/legal-discovery";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = legalDiscoverySearchSchema.parse(await request.json());
    const results = await searchLegalContent(payload);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
