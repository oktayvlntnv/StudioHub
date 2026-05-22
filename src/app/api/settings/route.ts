import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/auth/owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { handleApiError } from "@/lib/api";

const settingsSchema = z.object({
  preferredLanguages: z.array(z.string()).default([]),
  preferredCountries: z.array(z.string()).default([]),
  preferredCategories: z.array(z.string()).default([]),
  defaultPlaybackPreference: z.enum(["in_app", "official_provider"]),
  hideUnknownAccess: z.boolean(),
  hideUnconfirmedSources: z.boolean(),
});

export async function PATCH(request: Request) {
  const { session, response } = await requireOwnerSession();
  if (response || !session) return response;

  try {
    const payload = settingsSchema.parse(await request.json());

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        message: "Settings validated. Configure Supabase admin credentials to persist changes.",
      });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin!
      .from("profiles")
      .update({
        preferred_languages: payload.preferredLanguages,
        preferred_countries: payload.preferredCountries,
        preferred_categories: payload.preferredCategories,
        default_playback_preference: payload.defaultPlaybackPreference,
        hide_unknown_access: payload.hideUnknownAccess,
        hide_unconfirmed_sources: payload.hideUnconfirmedSources,
      })
      .eq("id", session.userId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Settings saved." });
  } catch (error) {
    return handleApiError(error);
  }
}
