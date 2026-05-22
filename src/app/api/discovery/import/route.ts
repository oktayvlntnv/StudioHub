import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireOwnerSession } from "@/lib/auth/owner";
import {
  importLegalDiscovery,
  legalDiscoveryImportSchema,
} from "@/lib/services/legal-discovery";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const result = await importLegalDiscovery(
      legalDiscoveryImportSchema.parse(await request.json()),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
