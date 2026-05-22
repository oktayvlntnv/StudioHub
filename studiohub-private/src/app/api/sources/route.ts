import { NextResponse } from "next/server";
import { z } from "zod";
import { getSources } from "@/lib/data/catalog";
import { requireOwnerSession } from "@/lib/auth/owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { handleApiError, jsonError } from "@/lib/api";
import { createXtreamSource, xtreamSourceSchema } from "@/lib/services/xtream";

const m3uSourceSchema = z.object({
  sourceType: z.enum(["m3u_url", "m3u_file", "xmltv_epg"]),
  name: z.string().min(2).max(120),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  epgUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  country: z.string().optional(),
  providerWebsite: z.string().url().optional().or(z.literal("")),
  legalContactInfo: z.string().optional(),
  isLegalConfirmed: z.boolean(),
});

export async function GET() {
  const { response } = await requireOwnerSession();
  if (response) return response;

  const sources = await getSources();
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const body = await request.json();

    if (body.sourceType === "xtream") {
      const result = await createXtreamSource(xtreamSourceSchema.parse(body));
      return NextResponse.json(result, { status: 201 });
    }

    const payload = m3uSourceSchema.parse(body);
    if (!payload.isLegalConfirmed) {
      return jsonError("Legal confirmation is required before saving a source.", 400);
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { id: "mock-source", message: "Validated source in mock mode." },
        { status: 201 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin!
      .from("iptv_sources")
      .insert({
        name: payload.name,
        source_type: payload.sourceType,
        source_url: payload.sourceUrl || null,
        epg_url: payload.epgUrl || null,
        is_legal_confirmed: payload.isLegalConfirmed,
        is_enabled: false,
        notes: payload.notes ?? null,
        country: payload.country ?? null,
        provider_website: payload.providerWebsite || null,
        legal_contact_info: payload.legalContactInfo ?? null,
        last_status: "unknown",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(
      { id: data.id, message: "Source saved disabled." },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
