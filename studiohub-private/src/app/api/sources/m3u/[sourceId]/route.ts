import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import {
  deleteM3USource,
  m3uSourceUpdateSchema,
  updateM3USource,
} from "@/lib/services/m3u-management";

interface M3USourceRouteContext {
  params: Promise<{ sourceId: string }>;
}

function normalizeUpdateBody(body: Record<string, unknown>) {
  return {
    name: body.name,
    sourceUrl: body.sourceUrl ?? body.source_url,
    epgUrl: body.epgUrl ?? body.epg_url,
    country: body.country,
    notes: body.notes,
    isEnabled: body.isEnabled ?? body.is_enabled,
    isLegalConfirmed: body.isLegalConfirmed ?? body.is_legal_confirmed,
    providerWebsite: body.providerWebsite ?? body.provider_website,
    legalContactInfo: body.legalContactInfo ?? body.legal_contact_info,
  };
}

function refreshM3UPages(sourceId: string) {
  revalidatePath("/sources");
  revalidatePath("/sources/m3u");
  revalidatePath(`/sources/m3u/${sourceId}`);
  revalidatePath("/live-tv");
}

export async function PATCH(request: Request, context: M3USourceRouteContext) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const { sourceId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = m3uSourceUpdateSchema.parse(normalizeUpdateBody(body));
    const result = await updateM3USource(sourceId, payload);
    refreshM3UPages(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: M3USourceRouteContext) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const { sourceId } = await context.params;
    const result = await deleteM3USource(sourceId);
    refreshM3UPages(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
