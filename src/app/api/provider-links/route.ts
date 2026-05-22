import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/auth/owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { handleApiError } from "@/lib/api";

const providerLinkSchema = z.object({
  mediaItemId: z.string().min(1),
  providerId: z.string().min(1).optional(),
  iptvSourceId: z.string().min(1).optional(),
  watchUrl: z.string().url().optional().or(z.literal("")),
  playbackType: z.enum(["external_link", "youtube_embed", "official_embed"]),
  accessType: z.enum([
    "no_login_required",
    "optional_login",
    "login_required",
    "unknown",
  ]),
  sourceType: z.enum(["official_provider", "youtube", "manual", "other_legal"]),
  youtubeVideoId: z.string().optional(),
  embedUrl: z.string().url().optional().or(z.literal("")),
  isFree: z.boolean().default(false),
  isLegalConfirmed: z.boolean(),
  availabilityCountry: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

function parseYouTubeVideoId(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0];
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") ?? undefined;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isMissingNotesColumn(message: string) {
  return message.includes("notes");
}

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = providerLinkSchema.parse(await request.json());

    if (!payload.isLegalConfirmed) {
      return NextResponse.json(
        { error: "Legal confirmation is required before adding a provider link." },
        { status: 400 },
      );
    }

    if (payload.playbackType === "external_link" && !payload.watchUrl) {
      return NextResponse.json(
        { error: "An official watch URL is required for external provider links." },
        { status: 400 },
      );
    }

    if (payload.playbackType === "official_embed" && !payload.embedUrl) {
      return NextResponse.json(
        { error: "An official embed URL is required for official embeds." },
        { status: 400 },
      );
    }

    const youtubeVideoId =
      payload.youtubeVideoId ?? parseYouTubeVideoId(payload.watchUrl);

    if (payload.playbackType === "youtube_embed" && !youtubeVideoId) {
      return NextResponse.json(
        { error: "A YouTube video ID or official YouTube watch URL is required." },
        { status: 400 },
      );
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { id: "mock-provider-link", message: "Mock provider link saved." },
        { status: 201 },
      );
    }

    const admin = createSupabaseAdminClient();
    const row = {
        media_item_id: payload.mediaItemId,
        provider_id: payload.providerId ?? null,
        iptv_source_id: payload.iptvSourceId ?? null,
        watch_url: payload.watchUrl || null,
        playback_type: payload.playbackType,
        access_type: payload.accessType,
        source_type: payload.sourceType,
        youtube_video_id: youtubeVideoId ?? null,
        embed_url: payload.embedUrl || null,
        is_free: payload.isFree,
        is_legal_confirmed: payload.isLegalConfirmed,
        availability_country: payload.availabilityCountry,
        notes: payload.notes ?? null,
      };

    const { data, error } = await admin!
      .from("media_provider_links")
      .insert(row)
      .select("id")
      .single();

    if (!error) return NextResponse.json({ id: data.id }, { status: 201 });

    if (!isMissingNotesColumn(error.message)) throw new Error(error.message);

    const { notes, ...legacyRow } = row;
    void notes;
    const legacyResult = await admin!
      .from("media_provider_links")
      .insert(legacyRow)
      .select("id")
      .single();

    if (legacyResult.error) throw new Error(legacyResult.error.message);
    return NextResponse.json(
      {
        id: legacyResult.data.id,
        message:
          "Provider link saved. Run supabase/provider-support-patch.sql to persist link notes.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
