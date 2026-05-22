import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import {
  autoImportLegalDiscovery,
  legalDiscoveryAutoImportSchema,
} from "@/lib/services/legal-discovery";

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = legalDiscoveryAutoImportSchema.parse(await request.json());
    const result = await autoImportLegalDiscovery(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Auto discovery import failed.",
      },
      { status: 400 },
    );
  }
}
