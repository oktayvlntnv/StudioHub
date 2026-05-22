import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError } from "@/lib/api";
import { requireOwnerSession } from "@/lib/auth/owner";
import { getProviders } from "@/lib/data/catalog";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  providerType: z.enum([
    "free_avod",
    "free_live_tv",
    "youtube",
    "public_broadcaster",
    "official_provider",
  ]),
  defaultPlaybackType: z.enum([
    "external_link",
    "youtube_embed",
    "official_embed",
  ]),
  defaultAccessType: z.enum([
    "no_login_required",
    "optional_login",
    "login_required",
    "unknown",
  ]),
  countryAvailability: z.array(z.string()).default([]),
  isEnabled: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

const providerPatchSchema = providerSchema.partial().extend({
  id: z.string().uuid(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function providerPayload(payload: z.infer<typeof providerSchema>) {
  return {
    name: payload.name,
    slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
    website_url: payload.websiteUrl || null,
    logo_url: payload.logoUrl || null,
    provider_type: payload.providerType,
    default_playback_type: payload.defaultPlaybackType,
    default_access_type: payload.defaultAccessType,
    country_availability: payload.countryAvailability,
    is_enabled: payload.isEnabled,
    notes: payload.notes || null,
  };
}

function legacyProviderPayload(payload: z.infer<typeof providerSchema>) {
  return {
    name: payload.name,
    website_url: payload.websiteUrl || null,
    logo_url: payload.logoUrl || null,
    provider_type: payload.providerType,
    country_availability: payload.countryAvailability,
  };
}

function isMissingProviderColumn(message: string) {
  return (
    message.includes("slug") ||
    message.includes("default_playback_type") ||
    message.includes("default_access_type") ||
    message.includes("is_enabled") ||
    message.includes("notes")
  );
}

export async function GET() {
  const { response } = await requireOwnerSession();
  if (response) return response;

  const providers = await getProviders();
  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = providerSchema.parse(await request.json());

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { id: "mock-provider", message: "Provider validated in mock mode." },
        { status: 201 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin!
      .from("providers")
      .insert(providerPayload(payload))
      .select("id")
      .single();

    if (!error) {
      revalidatePath("/sources/providers");
      revalidatePath("/sources");
      return NextResponse.json({ id: data.id }, { status: 201 });
    }

    if (!isMissingProviderColumn(error.message)) {
      throw new Error(error.message);
    }

    const legacyInsert = await admin!
      .from("providers")
      .insert(legacyProviderPayload(payload))
      .select("id")
      .single();

    if (legacyInsert.error) throw new Error(legacyInsert.error.message);
    revalidatePath("/sources/providers");
    revalidatePath("/sources");
    return NextResponse.json(
      {
        id: legacyInsert.data.id,
        message:
          "Provider saved. Run supabase/provider-support-patch.sql to persist defaults, enabled state, and notes.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = providerPatchSchema.parse(await request.json());
    const { id, ...fields } = payload;

    if (!Object.keys(fields).length) {
      return jsonError("No provider fields were supplied.", 400);
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ id, message: "Provider updated in mock mode." });
    }

    const update: Record<string, unknown> = {};
    const legacyUpdate: Record<string, unknown> = {};
    if (fields.name !== undefined) update.name = fields.name;
    if (fields.name !== undefined) legacyUpdate.name = fields.name;
    if (fields.slug !== undefined) {
      update.slug = fields.slug ? slugify(fields.slug) : undefined;
    }
    if (fields.websiteUrl !== undefined) update.website_url = fields.websiteUrl || null;
    if (fields.websiteUrl !== undefined) {
      legacyUpdate.website_url = fields.websiteUrl || null;
    }
    if (fields.logoUrl !== undefined) update.logo_url = fields.logoUrl || null;
    if (fields.logoUrl !== undefined) legacyUpdate.logo_url = fields.logoUrl || null;
    if (fields.providerType !== undefined) update.provider_type = fields.providerType;
    if (fields.providerType !== undefined) {
      legacyUpdate.provider_type = fields.providerType;
    }
    if (fields.defaultPlaybackType !== undefined) {
      update.default_playback_type = fields.defaultPlaybackType;
    }
    if (fields.defaultAccessType !== undefined) {
      update.default_access_type = fields.defaultAccessType;
    }
    if (fields.countryAvailability !== undefined) {
      update.country_availability = fields.countryAvailability;
      legacyUpdate.country_availability = fields.countryAvailability;
    }
    if (fields.isEnabled !== undefined) update.is_enabled = fields.isEnabled;
    if (fields.notes !== undefined) update.notes = fields.notes || null;

    const admin = createSupabaseAdminClient();
    const { error } = await admin!.from("providers").update(update).eq("id", id);

    if (error) {
      if (!isMissingProviderColumn(error.message) || !Object.keys(legacyUpdate).length) {
        throw new Error(error.message);
      }

      const legacyResult = await admin!
        .from("providers")
        .update(legacyUpdate)
        .eq("id", id);

      if (legacyResult.error) throw new Error(legacyResult.error.message);
    }
    revalidatePath("/sources/providers");
    revalidatePath("/sources");
    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("Provider id is required.", 400);

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ id, message: "Provider deleted in mock mode." });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin!.from("providers").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/sources/providers");
    revalidatePath("/sources");
    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
