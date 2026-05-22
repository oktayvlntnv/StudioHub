import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/auth/owner";
import { handleApiError } from "@/lib/api";
import {
  approveAllM3UChannels,
  deleteAllM3UChannels,
  deletePendingM3UChannels,
  getM3USourceStats,
  rejectAllM3UChannels,
} from "@/lib/services/m3u-management";

interface M3UChannelsRouteContext {
  params: Promise<{ sourceId: string }>;
}

const bulkActionSchema = z.object({
  action: z.enum([
    "approve_all",
    "reject_all",
    "delete_pending",
    "delete_all",
  ]),
});

function refreshM3UPages(sourceId: string) {
  revalidatePath("/sources");
  revalidatePath("/sources/m3u");
  revalidatePath(`/sources/m3u/${sourceId}`);
  revalidatePath("/live-tv");
}

export async function GET(_request: Request, context: M3UChannelsRouteContext) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const { sourceId } = await context.params;
    const stats = await getM3USourceStats(sourceId);
    return NextResponse.json({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: M3UChannelsRouteContext) {
  const { response } = await requireOwnerSession();
  if (response) return response;

  try {
    const { sourceId } = await context.params;
    const { action } = bulkActionSchema.parse(await request.json());
    const result =
      action === "approve_all"
        ? await approveAllM3UChannels(sourceId)
        : action === "reject_all"
          ? await rejectAllM3UChannels(sourceId)
          : action === "delete_pending"
            ? await deletePendingM3UChannels(sourceId)
            : await deleteAllM3UChannels(sourceId);

    refreshM3UPages(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
