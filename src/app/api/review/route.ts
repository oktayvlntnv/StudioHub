import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/auth/owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { handleApiError } from "@/lib/api";

const reviewSchema = z.object({
  itemType: z.enum(["media", "live"]),
  id: z.string().min(1),
  status: z.enum(["approved", "rejected", "pending_review"]),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const payload = reviewSchema.parse(await request.json());
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        message: `${payload.itemType} item review validated as ${payload.status}. Configure Supabase admin credentials to persist changes.`,
      });
    }

    const admin = createSupabaseAdminClient();
    const table = payload.itemType === "media" ? "media_items" : "live_channels";
    const update: Record<string, unknown> = {
      import_status: payload.status,
      legal_review_notes: payload.notes ?? null,
    };

    if (payload.itemType === "live") {
      update.is_legal_confirmed = payload.status === "approved";
    }

    const { error } = await admin!
      .from(table)
      .update(update)
      .eq("id", payload.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Review status updated." });
  } catch (error) {
    return handleApiError(error);
  }
}
