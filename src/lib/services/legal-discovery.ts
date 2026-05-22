import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env, isSupabaseAdminConfigured, isYouTubeConfigured } from "@/lib/env";
import type { AccessType, ImportStatus, PlaybackType, SourceType } from "@/types/studiohub";

export const discoverySourceSchema = z.enum([
  "youtube",
  "internet_archive",
  "iptv_org",
]);

export const legalDiscoverySearchSchema = z.object({
  source: discoverySourceSchema,
  query: z.string().trim().max(120).optional().default(""),
  country: z.string().trim().max(2).optional().default(""),
  category: z.string().trim().max(40).optional().default(""),
  maxResults: z.coerce.number().int().min(1).max(50).default(12),
});

export const legalDiscoveryImportSchema = legalDiscoverySearchSchema.extend({
  selectedIds: z.array(z.string().min(1)).min(1).max(50),
  importStatus: z.enum(["pending_review", "approved"]).default("pending_review"),
  isLegalConfirmed: z.boolean().default(false),
});

export const legalDiscoveryAutoImportSchema = z.object({
  includeInternetArchive: z.boolean().default(true),
  includeIptvOrg: z.boolean().default(true),
  includeYouTube: z.boolean().default(false),
  country: z.string().trim().max(2).optional().default(""),
  maxPerPreset: z.coerce.number().int().min(3).max(25).default(8),
  importStatus: z.enum(["pending_review", "approved"]).default("pending_review"),
  isLegalConfirmed: z.boolean().default(false),
});

export type DiscoverySearchInput = z.infer<typeof legalDiscoverySearchSchema>;
export type DiscoveryImportInput = z.infer<typeof legalDiscoveryImportSchema>;
export type DiscoveryAutoImportInput = z.infer<
  typeof legalDiscoveryAutoImportSchema
>;

export interface LegalDiscoveryResult {
  id: string;
  source: z.infer<typeof discoverySourceSchema>;
  title: string;
  description: string;
  providerName: string;
  mediaType: "movie" | "tv" | "live";
  sourceType: SourceType;
  playbackType: PlaybackType;
  accessType: AccessType;
  watchUrl?: string;
  embedUrl?: string;
  videoUrl?: string;
  streamUrl?: string;
  youtubeVideoId?: string;
  posterUrl?: string;
  releaseDate?: string;
  runtime?: number;
  genres: string[];
  country: string[];
  language: string;
  isFree: boolean;
  legalNote: string;
}

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }>;
};

type YouTubeVideosResponse = {
  items?: Array<{
    id: string;
    status?: { embeddable?: boolean };
    contentDetails?: { duration?: string };
  }>;
};

type ArchiveSearchResponse = {
  response?: {
    docs?: Array<{
      identifier?: string;
      title?: string;
      description?: string;
      year?: number;
      date?: string;
      licenseurl?: string;
      subject?: string[] | string;
    }>;
  };
};

type ArchiveMetadataResponse = {
  files?: Array<{
    name?: string;
    format?: string;
    source?: string;
  }>;
};

type IptvOrgChannel = {
  id: string;
  name: string;
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  website?: string | null;
};

type IptvOrgStream = {
  channel?: string | null;
  title?: string;
  url?: string;
  quality?: string | null;
  label?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
};

function clampText(value: string | undefined | null, fallback = "") {
  return (value ?? fallback).replace(/\s+/g, " ").trim();
}

function archivePath(identifier: string, filename: string) {
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${filename
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function parseYouTubeDuration(duration?: string) {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return Math.max(1, Math.round(hours * 60 + minutes + seconds / 60));
}

function legalStatus(source: {
  importStatus: "pending_review" | "approved";
  isLegalConfirmed: boolean;
}) {
  if (source.importStatus === "approved" && !source.isLegalConfirmed) {
    throw new Error("Legal confirmation is required before importing as approved.");
  }

  return {
    importStatus: source.importStatus satisfies ImportStatus,
    isLegalConfirmed: source.importStatus === "approved" && source.isLegalConfirmed,
  };
}

async function getJson<T>(url: URL | string) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Discovery source request failed.");
  }

  return response.json() as Promise<T>;
}

async function searchYouTube(input: DiscoverySearchInput) {
  if (!isYouTubeConfigured()) {
    throw new Error("YOUTUBE_API_KEY is required for YouTube discovery.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(input.maxResults));
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("videoLicense", "creativeCommon");
  url.searchParams.set("videoSyndicated", "true");
  url.searchParams.set("q", input.query || "public domain movie documentary");
  url.searchParams.set("key", env.youtubeApiKey!);

  const data = await getJson<YouTubeSearchResponse>(url);
  const videoIds = (data.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (!videoIds.length) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "status,contentDetails");
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("key", env.youtubeApiKey!);

  const videos = await getJson<YouTubeVideosResponse>(videosUrl);
  const details = new Map((videos.items ?? []).map((item) => [item.id, item]));

  return (data.items ?? []).flatMap((item): LegalDiscoveryResult[] => {
    const videoId = item.id?.videoId;
    if (!videoId) return [];
    const detail = details.get(videoId);
    if (detail?.status?.embeddable === false) return [];

    const snippet = item.snippet;
    const title = clampText(snippet?.title, "Untitled YouTube video");
    return [
      {
        id: `youtube:${videoId}`,
        source: "youtube",
        title,
        description: clampText(snippet?.description, "Official embeddable YouTube video."),
        providerName: "YouTube",
        mediaType: "movie",
        sourceType: "youtube",
        playbackType: "youtube_embed",
        accessType: "no_login_required",
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        youtubeVideoId: videoId,
        posterUrl: snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.medium?.url,
        releaseDate: snippet?.publishedAt?.slice(0, 10),
        runtime: parseYouTubeDuration(detail?.contentDetails?.duration),
        genres: ["YouTube", "Creative Commons"],
        country: [],
        language: "Unknown",
        isFree: true,
        legalNote:
          "Found via YouTube Data API with embeddable and Creative Commons filters. Owner review is still required before approval.",
      },
    ];
  });
}

function archiveQuery(input: DiscoverySearchInput) {
  const cleanQuery = input.query.replace(/[()"]/g, " ").trim();
  const base = "mediatype:movies AND (collection:feature_films OR collection:opensource_movies)";
  return cleanQuery ? `${base} AND (${cleanQuery})` : base;
}

function archiveGenres(subject?: string[] | string) {
  if (Array.isArray(subject)) return subject.slice(0, 5);
  if (typeof subject === "string") return subject.split(";").slice(0, 5);
  return ["Internet Archive"];
}

async function archiveMp4(identifier: string) {
  const metadata = await getJson<ArchiveMetadataResponse>(
    `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
  );
  const file = (metadata.files ?? []).find((entry) => {
    const name = entry.name ?? "";
    const format = (entry.format ?? "").toLowerCase();
    return name.toLowerCase().endsWith(".mp4") || format.includes("mpeg4");
  });

  return file?.name ? archivePath(identifier, file.name) : undefined;
}

async function searchInternetArchive(input: DiscoverySearchInput) {
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", archiveQuery(input));
  ["identifier", "title", "description", "year", "date", "licenseurl", "subject"].forEach(
    (field) => url.searchParams.append("fl[]", field),
  );
  url.searchParams.set("rows", String(input.maxResults));
  url.searchParams.set("page", "1");
  url.searchParams.set("output", "json");

  const data = await getJson<ArchiveSearchResponse>(url);
  const docs = data.response?.docs ?? [];
  const withFiles = await Promise.all(
    docs.map(async (doc) => ({
      doc,
      videoUrl: doc.identifier ? await archiveMp4(doc.identifier) : undefined,
    })),
  );

  return withFiles.flatMap(({ doc, videoUrl }): LegalDiscoveryResult[] => {
    if (!doc.identifier) return [];
    const title = clampText(doc.title, doc.identifier);
    const license = doc.licenseurl ?? "";
    const sourceType: SourceType = /publicdomain|creativecommons/i.test(license)
      ? "public_domain"
      : "other_legal";

    return [
      {
        id: `archive:${doc.identifier}`,
        source: "internet_archive",
        title,
        description: clampText(doc.description, "Internet Archive movie item."),
        providerName: "Internet Archive",
        mediaType: "movie",
        sourceType,
        playbackType: videoUrl ? "public_domain_video" : "external_link",
        accessType: "no_login_required",
        watchUrl: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
        videoUrl,
        releaseDate: doc.date?.slice(0, 10) ?? (doc.year ? `${doc.year}-01-01` : undefined),
        genres: archiveGenres(doc.subject),
        country: [],
        language: "Unknown",
        isFree: true,
        legalNote:
          "Found via Internet Archive metadata API. Owner should confirm license details before approval.",
      },
    ];
  });
}

async function searchIptvOrg(input: DiscoverySearchInput) {
  const [channels, streams] = await Promise.all([
    getJson<IptvOrgChannel[]>("https://iptv-org.github.io/api/channels.json"),
    getJson<IptvOrgStream[]>("https://iptv-org.github.io/api/streams.json"),
  ]);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  const query = input.query.toLowerCase();
  const country = input.country.toUpperCase();
  const category = input.category.toLowerCase();
  const results: LegalDiscoveryResult[] = [];

  for (const stream of streams) {
    if (!stream.url) continue;
    if (stream.user_agent || stream.referrer) continue;
    if (stream.label?.toLowerCase().includes("geo-blocked")) continue;

    const channel = stream.channel ? channelMap.get(stream.channel) : undefined;
    if (channel?.is_nsfw) continue;
    const title = clampText(channel?.name ?? stream.title, "Live TV channel");
    const categories = channel?.categories ?? [];

    if (query && !`${title} ${stream.title ?? ""}`.toLowerCase().includes(query)) {
      continue;
    }
    if (country && channel?.country !== country) continue;
    if (category && !categories.some((item) => item.toLowerCase() === category)) {
      continue;
    }

    results.push({
      id: `iptv-org:${stream.channel ?? stream.title}:${stream.url}`,
      source: "iptv_org",
      title,
      description: stream.label
        ? `Public live stream listed by IPTV-org. Note: ${stream.label}.`
        : "Public live stream listed by IPTV-org.",
      providerName: "IPTV-org",
      mediaType: "live",
      sourceType: "m3u",
      playbackType: "m3u_stream",
      accessType: "no_login_required",
      watchUrl: channel?.website ?? undefined,
      streamUrl: stream.url,
      genres: categories.length ? categories : ["Live TV"],
      country: channel?.country ? [channel.country] : [],
      language: "Unknown",
      isFree: true,
      legalNote:
        "Found via IPTV-org public API. StudioHub excludes entries requiring custom headers and geo-blocked labels.",
    });

    if (results.length >= input.maxResults) break;
  }

  return results;
}

export async function searchLegalContent(input: DiscoverySearchInput) {
  const payload = legalDiscoverySearchSchema.parse(input);

  switch (payload.source) {
    case "youtube":
      return searchYouTube(payload);
    case "internet_archive":
      return searchInternetArchive(payload);
    case "iptv_org":
      return searchIptvOrg(payload);
  }
}

async function ensureProvider(provider: {
  defaultAccessType: "no_login_required" | "optional_login" | "login_required" | "unknown";
  defaultPlaybackType: "external_link" | "youtube_embed" | "official_embed";
  name: string;
  providerType: "free_avod" | "free_live_tv" | "youtube" | "public_broadcaster" | "official_provider";
  slug: string;
  websiteUrl: string;
  notes: string;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const existing = await admin
    .from("providers")
    .select("id")
    .eq("slug", provider.slug)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const { data, error } = await admin
    .from("providers")
    .insert({
      name: provider.name,
      slug: provider.slug,
      website_url: provider.websiteUrl,
      provider_type: provider.providerType,
      default_playback_type: provider.defaultPlaybackType,
      default_access_type: provider.defaultAccessType,
      country_availability: ["Global"],
      is_enabled: true,
      notes: provider.notes,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

async function ensureIptvOrgSource(providerId: string, isLegalConfirmed: boolean) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const existing = await admin
    .from("iptv_sources")
    .select("id")
    .eq("name", "IPTV-org public streams")
    .eq("source_type", "m3u_url")
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const { data, error } = await admin
    .from("iptv_sources")
    .insert({
      name: "IPTV-org public streams",
      source_type: "m3u_url",
      provider_id: providerId,
      source_url: "https://iptv-org.github.io/iptv/index.m3u",
      is_legal_confirmed: isLegalConfirmed,
      is_enabled: true,
      notes:
        "Imported from IPTV-org public API. Owner remains responsible for country and rights review.",
      provider_website: "https://github.com/iptv-org/iptv",
      legal_contact_info: "https://github.com/iptv-org/iptv#legal",
      last_status: "unknown",
      last_imported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

function providerForResult(result: LegalDiscoveryResult) {
  if (result.source === "youtube") {
    return {
      name: "YouTube",
      slug: "youtube",
      websiteUrl: "https://www.youtube.com",
      providerType: "youtube" as const,
      defaultPlaybackType: "youtube_embed" as const,
      defaultAccessType: "no_login_required" as const,
      notes: "Official YouTube embeds only when embedding is allowed.",
    };
  }
  if (result.source === "internet_archive") {
    return {
      name: "Internet Archive",
      slug: "internet-archive",
      websiteUrl: "https://archive.org",
      providerType: "public_broadcaster" as const,
      defaultPlaybackType: "external_link" as const,
      defaultAccessType: "no_login_required" as const,
      notes: "Public archive metadata and files require owner license review.",
    };
  }
  return {
    name: "IPTV-org",
    slug: "iptv-org",
    websiteUrl: "https://github.com/iptv-org/iptv",
    providerType: "free_live_tv" as const,
    defaultPlaybackType: "external_link" as const,
    defaultAccessType: "no_login_required" as const,
    notes: "Public live TV index. Owner remains responsible for regional legality.",
  };
}

async function hasExistingMedia(result: LegalDiscoveryResult) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const query = admin.from("media_provider_links").select("id").limit(1);
  if (result.youtubeVideoId) {
    return Boolean(
      (await query.eq("youtube_video_id", result.youtubeVideoId).maybeSingle()).data,
    );
  }
  if (result.watchUrl) {
    return Boolean((await query.eq("watch_url", result.watchUrl).maybeSingle()).data);
  }
  return false;
}

async function hasExistingChannel(result: LegalDiscoveryResult) {
  const admin = createSupabaseAdminClient();
  if (!admin || !result.streamUrl) return false;
  const { data } = await admin
    .from("live_channels")
    .select("id")
    .eq("stream_url", result.streamUrl)
    .maybeSingle();
  return Boolean(data);
}

async function importMediaResult(
  result: LegalDiscoveryResult,
  providerId: string,
  status: ReturnType<typeof legalStatus>,
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");
  if (await hasExistingMedia(result)) return { imported: 0, skipped: 1 };

  const { data: media, error: mediaError } = await admin
    .from("media_items")
    .insert({
      media_type: result.mediaType === "tv" ? "tv" : "movie",
      title: result.title,
      original_title: result.title,
      overview: result.description,
      poster_path: result.posterUrl ?? null,
      release_date: result.releaseDate ?? null,
      runtime: result.runtime ?? null,
      genres: result.genres,
      original_language: result.language,
      origin_country: result.country,
      source_type: result.sourceType,
      import_status: status.importStatus,
      legal_review_notes: result.legalNote,
    })
    .select("id")
    .single();

  if (mediaError) throw new Error(mediaError.message);

  const { error: linkError } = await admin.from("media_provider_links").insert({
    media_item_id: media.id,
    provider_id: providerId,
    watch_url: result.watchUrl ?? null,
    playback_type: result.playbackType,
    access_type: result.accessType,
    source_type: result.sourceType,
    youtube_video_id: result.youtubeVideoId ?? null,
    embed_url: result.embedUrl ?? null,
    video_url: result.videoUrl ?? null,
    stream_url: result.streamUrl ?? null,
    is_free: result.isFree,
    is_legal_confirmed: status.isLegalConfirmed,
    availability_country: result.country,
    notes: result.legalNote,
  });

  if (linkError) throw new Error(linkError.message);
  return { imported: 1, skipped: 0 };
}

async function importLiveResult(
  result: LegalDiscoveryResult,
  providerId: string,
  status: ReturnType<typeof legalStatus>,
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");
  if (await hasExistingChannel(result)) return { imported: 0, skipped: 1 };

  const iptvSourceId = await ensureIptvOrgSource(providerId, status.isLegalConfirmed);
  const { error } = await admin.from("live_channels").insert({
    name: result.title,
    description: result.description,
    category: result.genres[0] ?? "Live TV",
    country: result.country[0] ?? "Unknown",
    language: result.language,
    provider_id: providerId,
    iptv_source_id: iptvSourceId,
    watch_url: result.watchUrl ?? null,
    playback_type: "m3u_stream",
    access_type: result.accessType,
    source_type: "m3u",
    stream_url: result.streamUrl ?? null,
    is_free: result.isFree,
    is_legal_confirmed: status.isLegalConfirmed,
    import_status: status.importStatus,
    legal_review_notes: result.legalNote,
  });

  if (error) throw new Error(error.message);
  return { imported: 1, skipped: 0 };
}

export async function importLegalDiscovery(input: DiscoveryImportInput) {
  const payload = legalDiscoveryImportSchema.parse(input);
  const status = legalStatus(payload);

  if (!isSupabaseAdminConfigured()) {
    return {
      itemsFound: 0,
      itemsImported: 0,
      itemsSkipped: 0,
      message: "Discovery import requires Supabase admin credentials.",
    };
  }

  const candidates = await searchLegalContent({
    ...payload,
    maxResults: Math.max(payload.maxResults, payload.selectedIds.length),
  });
  const selected = candidates.filter((item) => payload.selectedIds.includes(item.id));
  const summary = await importDiscoveryResults(selected, status);

  return {
    itemsFound: selected.length,
    itemsImported: summary.itemsImported,
    itemsSkipped: summary.itemsSkipped,
    message: `Imported ${summary.itemsImported} items. Skipped ${summary.itemsSkipped} duplicates.`,
  };
}

async function importDiscoveryResults(
  selected: LegalDiscoveryResult[],
  status: ReturnType<typeof legalStatus>,
) {
  let itemsImported = 0;
  let itemsSkipped = 0;

  for (const result of selected) {
    const providerId = await ensureProvider(providerForResult(result));
    const summary =
      result.mediaType === "live"
        ? await importLiveResult(result, providerId, status)
        : await importMediaResult(result, providerId, status);
    itemsImported += summary.imported;
    itemsSkipped += summary.skipped;
  }

  return { itemsImported, itemsSkipped };
}

function autoImportPresets(input: DiscoveryAutoImportInput): DiscoverySearchInput[] {
  const presets: DiscoverySearchInput[] = [];
  const country = input.country.toUpperCase();

  if (input.includeInternetArchive) {
    ["public domain feature film", "classic movie", "documentary", "short film"].forEach(
      (query) =>
        presets.push({
          source: "internet_archive",
          query,
          country: "",
          category: "",
          maxResults: input.maxPerPreset,
        }),
    );
  }

  if (input.includeIptvOrg) {
    [
      { query: "", country, category: "" },
      { query: "", country: "", category: "news" },
      { query: "", country: "", category: "entertainment" },
      { query: "", country: "", category: "documentary" },
    ].forEach((preset) =>
      presets.push({
        source: "iptv_org",
        query: preset.query,
        country: preset.country,
        category: preset.category,
        maxResults: input.maxPerPreset,
      }),
    );
  }

  if (input.includeYouTube && isYouTubeConfigured()) {
    ["creative commons documentary", "public domain movie"].forEach((query) =>
      presets.push({
        source: "youtube",
        query,
        country: "",
        category: "",
        maxResults: input.maxPerPreset,
      }),
    );
  }

  return presets;
}

export async function autoImportLegalDiscovery(input: DiscoveryAutoImportInput) {
  const payload = legalDiscoveryAutoImportSchema.parse(input);
  const status = legalStatus(payload);

  if (!isSupabaseAdminConfigured()) {
    return {
      itemsFound: 0,
      itemsImported: 0,
      itemsSkipped: 0,
      searchesRun: 0,
      message: "Auto discovery import requires Supabase admin credentials.",
    };
  }

  const presets = autoImportPresets(payload);
  let itemsFound = 0;
  let itemsImported = 0;
  let itemsSkipped = 0;
  let searchesRun = 0;

  for (const preset of presets) {
    try {
      const results = await searchLegalContent(preset);
      searchesRun += 1;
      itemsFound += results.length;
      const summary = await importDiscoveryResults(results, status);
      itemsImported += summary.itemsImported;
      itemsSkipped += summary.itemsSkipped;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[legal-discovery:auto-import]", {
          source: preset.source,
          query: preset.query,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return {
    itemsFound,
    itemsImported,
    itemsSkipped,
    searchesRun,
    message:
      payload.importStatus === "approved"
        ? `Auto discovery imported ${itemsImported} approved items and skipped ${itemsSkipped} duplicates.`
        : `Auto discovery imported ${itemsImported} review items and skipped ${itemsSkipped} duplicates.`,
  };
}
