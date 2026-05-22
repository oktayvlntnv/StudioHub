import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import type { AccessType, LiveChannel, PlaybackType } from "@/types/studiohub";

export const m3uImportSchema = z
  .object({
    sourceId: z.string().uuid().optional(),
    sourceName: z.string().min(2).max(120).default("M3U source"),
    m3uUrl: z.string().url().optional(),
    fileContent: z.string().optional(),
    epgUrl: z.string().url().optional().or(z.literal("")),
    country: z.string().max(80).optional(),
    language: z.string().max(80).optional(),
    accessType: z
      .enum([
        "no_login_required",
        "optional_login",
        "login_required",
        "owner_credentials_required",
        "unknown",
      ])
      .default("unknown"),
    playbackType: z
      .enum(["official_live_stream", "m3u_stream"])
      .default("m3u_stream"),
    isFree: z.boolean().default(false),
    isLegalConfirmed: z.boolean(),
  })
  .refine((value) => value.m3uUrl || value.fileContent, {
    message: "Provide either an M3U URL or uploaded file content.",
  });

export interface ParsedM3UChannel {
  name: string;
  logo?: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  streamUrl: string;
}

const attributeRegex = /([\w-]+)="([^"]*)"/g;

function parseAttributes(line: string) {
  const attributes: Record<string, string> = {};
  for (const match of line.matchAll(attributeRegex)) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function parseName(line: string) {
  const commaIndex = line.lastIndexOf(",");
  return commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : "Unnamed channel";
}

export function parseM3U(content: string): ParsedM3UChannel[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const channels: ParsedM3UChannel[] = [];
  let currentInfo: {
    name: string;
    logo?: string;
    groupTitle?: string;
    tvgId?: string;
    tvgName?: string;
  } | null = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const attrs = parseAttributes(line);
      currentInfo = {
        name: parseName(line),
        logo: attrs["tvg-logo"],
        groupTitle: attrs["group-title"],
        tvgId: attrs["tvg-id"],
        tvgName: attrs["tvg-name"],
      };
      continue;
    }

    if (line.startsWith("#")) continue;

    if (currentInfo && /^https?:\/\//i.test(line)) {
      channels.push({
        ...currentInfo,
        streamUrl: line,
      });
      currentInfo = null;
    }
  }

  return channels;
}

function previewChannel(channel: ParsedM3UChannel) {
  return {
    name: channel.name,
    logo: channel.logo,
    groupTitle: channel.groupTitle,
    tvgId: channel.tvgId,
    tvgName: channel.tvgName,
  };
}

async function getM3UContent(m3uUrl?: string, fileContent?: string) {
  if (fileContent) return fileContent;
  if (!m3uUrl) throw new Error("Missing M3U URL.");

  const response = await fetch(m3uUrl, {
    headers: {
      accept: "application/x-mpegURL,text/plain,*/*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch M3U playlist.");
  }

  return response.text();
}

export async function importM3UPlaylist(input: z.infer<typeof m3uImportSchema>) {
  const payload = m3uImportSchema.parse(input);
  if (!payload.isLegalConfirmed) {
    throw new Error("Legal confirmation is required before importing an M3U playlist.");
  }

  const content = await getM3UContent(payload.m3uUrl, payload.fileContent);
  const channels = parseM3U(content);

  if (!isSupabaseAdminConfigured()) {
    return {
      sourceId: "mock-source",
      itemsFound: channels.length,
      itemsImported: 0,
      preview: channels.slice(0, 20).map(previewChannel),
      message:
        "Parsed playlist. Configure Supabase admin credentials to persist imported channels.",
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  let sourceId = payload.sourceId;
  if (!sourceId) {
    const { data, error } = await admin
      .from("iptv_sources")
      .insert({
        name: payload.sourceName,
        source_type: payload.m3uUrl ? "m3u_url" : "m3u_file",
        source_url: payload.m3uUrl,
        epg_url: payload.epgUrl || null,
        is_legal_confirmed: true,
        is_enabled: false,
        notes:
          "Imported source. Items start pending review and source remains disabled until owner enables it.",
        country: payload.country ?? null,
        last_status: "unknown",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    sourceId = data.id;
  }

  const rows = channels.map((channel) => ({
    name: channel.name,
    description: "Imported from legal M3U source. Pending owner review.",
    logo_url: channel.logo ?? null,
    category: channel.groupTitle ?? "Uncategorized",
    country: payload.country ?? "Unknown",
    language: payload.language ?? "Unknown",
    iptv_source_id: sourceId,
    playback_type: payload.playbackType satisfies PlaybackType,
    access_type: payload.accessType satisfies AccessType,
    source_type: "m3u",
    stream_url: channel.streamUrl,
    tvg_id: channel.tvgId ?? null,
    tvg_name: channel.tvgName ?? channel.name,
    tvg_logo: channel.logo ?? null,
    group_title: channel.groupTitle ?? null,
    is_free: payload.isFree,
    is_legal_confirmed: true,
    import_status: "pending_review",
    legal_review_notes:
      "Imported from M3U. Owner must approve before it appears in Live TV.",
  }));

  const { error } = await admin.from("live_channels").insert(rows);
  if (error) throw new Error(error.message);

  await admin.from("iptv_sources").update({
    last_imported_at: new Date().toISOString(),
    last_status: "success",
  }).eq("id", sourceId);

  await admin.from("import_logs").insert({
    iptv_source_id: sourceId,
    import_type: "m3u",
    status: "success",
    message: "M3U import completed. Items are pending review.",
    items_found: channels.length,
    items_imported: rows.length,
  });

  return {
    sourceId,
    itemsFound: channels.length,
    itemsImported: rows.length,
    preview: channels.slice(0, 20).map(previewChannel),
    message: "Imported M3U channels as pending review.",
  };
}

export function normalizeM3UChannel(channel: ParsedM3UChannel): Partial<LiveChannel> {
  return {
    name: channel.name,
    category: channel.groupTitle ?? "Uncategorized",
    tvgId: channel.tvgId,
    tvgName: channel.tvgName,
    tvgLogo: channel.logo,
    groupTitle: channel.groupTitle,
    playbackType: "m3u_stream",
    sourceType: "m3u",
    importStatus: "pending_review",
  };
}
