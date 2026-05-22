import { z } from "zod";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { M3UChannelStats } from "@/types/studiohub";

const m3uSourceTypes = ["m3u_url", "m3u_file"] as const;

export const m3uSourceIdSchema = z.string().uuid();

export const m3uSourceUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  epgUrl: z.string().url().optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  isEnabled: z.boolean().optional(),
  isLegalConfirmed: z.boolean().optional(),
  providerWebsite: z.string().url().optional().or(z.literal("")),
  legalContactInfo: z.string().max(2000).optional().or(z.literal("")),
});

export type M3USourceUpdateInput = z.infer<typeof m3uSourceUpdateSchema>;

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

function getAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;
  return createSupabaseAdminClient();
}

function debugM3UAction(action: string, sourceId: string, affectedRows?: number) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[StudioHub M3U]", { action, sourceId, affectedRows });
}

async function assertM3USource(admin: AdminClient, sourceId: string) {
  const { data, error } = await admin
    .from("iptv_sources")
    .select("id, source_type")
    .eq("id", sourceId)
    .in("source_type", [...m3uSourceTypes])
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("M3U source was not found.");
  return data;
}

async function countM3UChannels(
  admin: AdminClient,
  sourceId: string,
  status?: "pending_review" | "approved" | "rejected",
) {
  let query = admin
    .from("live_channels")
    .select("id", { count: "exact", head: true })
    .eq("iptv_source_id", sourceId)
    .eq("source_type", "m3u");

  if (status) query = query.eq("import_status", status);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countImportLogs(admin: AdminClient, sourceId: string) {
  const { count, error } = await admin
    .from("import_logs")
    .select("id", { count: "exact", head: true })
    .eq("iptv_source_id", sourceId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getM3UStats(admin: AdminClient, sourceId: string) {
  const [total, pending, approved, rejected] = await Promise.all([
    countM3UChannels(admin, sourceId),
    countM3UChannels(admin, sourceId, "pending_review"),
    countM3UChannels(admin, sourceId, "approved"),
    countM3UChannels(admin, sourceId, "rejected"),
  ]);

  return { total, pending, approved, rejected };
}

function toUpdateRow(input: M3USourceUpdateInput) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.sourceUrl !== undefined) row.source_url = input.sourceUrl || null;
  if (input.epgUrl !== undefined) row.epg_url = input.epgUrl || null;
  if (input.country !== undefined) row.country = input.country || null;
  if (input.notes !== undefined) row.notes = input.notes || null;
  if (input.isEnabled !== undefined) row.is_enabled = input.isEnabled;
  if (input.isLegalConfirmed !== undefined) {
    row.is_legal_confirmed = input.isLegalConfirmed;
  }
  if (input.providerWebsite !== undefined) {
    row.provider_website = input.providerWebsite || null;
  }
  if (input.legalContactInfo !== undefined) {
    row.legal_contact_info = input.legalContactInfo || null;
  }
  row.updated_at = new Date().toISOString();
  return row;
}

function mockResult(action: string, sourceId: string) {
  debugM3UAction(action, sourceId, 0);
  return {
    message: `${action} validated. Configure Supabase admin credentials to persist changes.`,
    affectedRows: 0,
    stats: { total: 0, pending: 0, approved: 0, rejected: 0 } satisfies M3UChannelStats,
  };
}

export async function getM3USourceStats(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();
  if (!admin) return mockResult("getM3USourceStats", parsedSourceId).stats;

  await assertM3USource(admin, parsedSourceId);
  return getM3UStats(admin, parsedSourceId);
}

export async function updateM3USource(
  sourceId: string,
  input: M3USourceUpdateInput,
) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const payload = m3uSourceUpdateSchema.parse(input);
  const admin = getAdminClient();

  if (!admin) return mockResult("updateM3USource", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const row = toUpdateRow(payload);

  const { error } = await admin
    .from("iptv_sources")
    .update(row)
    .eq("id", parsedSourceId)
    .in("source_type", [...m3uSourceTypes]);

  if (error) throw new Error(error.message);
  const stats = await getM3UStats(admin, parsedSourceId);
  debugM3UAction("updateM3USource", parsedSourceId, 1);

  return {
    message: "M3U source updated.",
    affectedRows: 1,
    stats,
  };
}

export async function deleteM3USource(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();

  if (!admin) return mockResult("deleteM3USource", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const channelsCount = await countM3UChannels(admin, parsedSourceId);
  const logsCount = await countImportLogs(admin, parsedSourceId);

  const channelDelete = await admin
    .from("live_channels")
    .delete()
    .eq("iptv_source_id", parsedSourceId)
    .eq("source_type", "m3u");

  if (channelDelete.error) throw new Error(channelDelete.error.message);

  const logDelete = await admin
    .from("import_logs")
    .delete()
    .eq("iptv_source_id", parsedSourceId);

  if (logDelete.error) throw new Error(logDelete.error.message);

  const sourceDelete = await admin
    .from("iptv_sources")
    .delete()
    .eq("id", parsedSourceId)
    .in("source_type", [...m3uSourceTypes]);

  if (sourceDelete.error) throw new Error(sourceDelete.error.message);

  const affectedRows = channelsCount + logsCount + 1;
  debugM3UAction("deleteM3USource", parsedSourceId, affectedRows);

  return {
    message: "M3U source and its M3U channels were deleted.",
    affectedRows,
    deletedChannels: channelsCount,
    deletedImportLogs: logsCount,
  };
}

export async function approveAllM3UChannels(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();

  if (!admin) return mockResult("approveAllM3UChannels", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const affectedRows = await countM3UChannels(
    admin,
    parsedSourceId,
    "pending_review",
  );

  const { error } = await admin
    .from("live_channels")
    .update({
      import_status: "approved",
      is_legal_confirmed: true,
      legal_review_notes: "Bulk approved by owner.",
      updated_at: new Date().toISOString(),
    })
    .eq("iptv_source_id", parsedSourceId)
    .eq("source_type", "m3u")
    .eq("import_status", "pending_review");

  if (error) throw new Error(error.message);
  const stats = await getM3UStats(admin, parsedSourceId);
  debugM3UAction("approveAllM3UChannels", parsedSourceId, affectedRows);

  return {
    message: "All pending M3U channels were approved.",
    affectedRows,
    stats,
  };
}

export async function rejectAllM3UChannels(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();

  if (!admin) return mockResult("rejectAllM3UChannels", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const affectedRows = await countM3UChannels(
    admin,
    parsedSourceId,
    "pending_review",
  );

  const { error } = await admin
    .from("live_channels")
    .update({
      import_status: "rejected",
      is_legal_confirmed: false,
      legal_review_notes: "Bulk rejected by owner.",
      updated_at: new Date().toISOString(),
    })
    .eq("iptv_source_id", parsedSourceId)
    .eq("source_type", "m3u")
    .eq("import_status", "pending_review");

  if (error) throw new Error(error.message);
  const stats = await getM3UStats(admin, parsedSourceId);
  debugM3UAction("rejectAllM3UChannels", parsedSourceId, affectedRows);

  return {
    message: "All pending M3U channels were rejected.",
    affectedRows,
    stats,
  };
}

export async function deletePendingM3UChannels(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();

  if (!admin) return mockResult("deletePendingM3UChannels", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const affectedRows = await countM3UChannels(
    admin,
    parsedSourceId,
    "pending_review",
  );

  const { error } = await admin
    .from("live_channels")
    .delete()
    .eq("iptv_source_id", parsedSourceId)
    .eq("source_type", "m3u")
    .eq("import_status", "pending_review");

  if (error) throw new Error(error.message);
  const stats = await getM3UStats(admin, parsedSourceId);
  debugM3UAction("deletePendingM3UChannels", parsedSourceId, affectedRows);

  return {
    message: "Pending M3U channels were deleted.",
    affectedRows,
    stats,
  };
}

export async function deleteAllM3UChannels(sourceId: string) {
  const parsedSourceId = m3uSourceIdSchema.parse(sourceId);
  const admin = getAdminClient();

  if (!admin) return mockResult("deleteAllM3UChannels", parsedSourceId);

  await assertM3USource(admin, parsedSourceId);
  const affectedRows = await countM3UChannels(admin, parsedSourceId);

  const { error } = await admin
    .from("live_channels")
    .delete()
    .eq("iptv_source_id", parsedSourceId)
    .eq("source_type", "m3u");

  if (error) throw new Error(error.message);
  const stats = await getM3UStats(admin, parsedSourceId);
  debugM3UAction("deleteAllM3UChannels", parsedSourceId, affectedRows);

  return {
    message: "All M3U channels for this source were deleted.",
    affectedRows,
    stats,
  };
}
