import {
  importLogs as mockImportLogs,
  liveChannels as mockLiveChannels,
  mediaItems as mockMediaItems,
  ownerSettings as mockOwnerSettings,
  pendingReviewItems as mockPendingReviewItems,
  providers as mockProviders,
  sources as mockSources,
} from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  AccessType,
  ImportLog,
  IptvSource,
  M3UChannelStats,
  LiveChannel,
  MediaItem,
  MediaProviderLink,
  OwnerSettings,
  PlaybackType,
  Provider,
  ProviderAccessType,
  ProviderPlaybackType,
  ProviderType,
  ReviewQueueItem,
  SourceType,
} from "@/types/studiohub";

type DbProvider = {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
  logo_url: string | null;
  provider_type: string | null;
  default_playback_type: ProviderPlaybackType | null;
  default_access_type: ProviderAccessType | null;
  country_availability: string[] | null;
  is_enabled: boolean | null;
  notes: string | null;
};

type DbMediaLink = {
  id: string;
  media_item_id: string;
  provider_id: string | null;
  iptv_source_id: string | null;
  watch_url: string | null;
  playback_type: PlaybackType;
  access_type: AccessType;
  source_type: SourceType;
  youtube_video_id: string | null;
  embed_url: string | null;
  video_url: string | null;
  stream_url: string | null;
  xtream_stream_id: string | null;
  is_free: boolean;
  is_legal_confirmed: boolean;
  availability_country: string[] | null;
  expires_at: string | null;
  last_checked_at: string | null;
  notes: string | null;
  providers?: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
  } | null;
  iptv_sources?: { name: string } | null;
};

type DbMediaItem = {
  id: string;
  tmdb_id: number | null;
  media_type: "movie" | "tv";
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  number_of_seasons: number | null;
  genres: string[] | null;
  original_language: string | null;
  origin_country: string[] | null;
  popularity: number | null;
  vote_average: number | null;
  source_type: SourceType;
  import_status: "pending_review" | "approved" | "rejected";
  legal_review_notes: string | null;
  created_at: string;
  media_provider_links?: DbMediaLink[];
};

type DbLiveChannel = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
  country: string | null;
  language: string | null;
  provider_id: string | null;
  iptv_source_id: string | null;
  watch_url: string | null;
  playback_type: LiveChannel["playbackType"];
  access_type: AccessType;
  source_type: SourceType;
  embed_url: string | null;
  stream_url: string | null;
  tvg_id: string | null;
  tvg_name: string | null;
  tvg_logo: string | null;
  group_title: string | null;
  xtream_stream_id: string | null;
  xtream_category_id: string | null;
  is_free: boolean;
  is_legal_confirmed: boolean;
  import_status: "pending_review" | "approved" | "rejected";
  legal_review_notes: string | null;
  last_checked_at: string | null;
  providers?: { name: string } | null;
  iptv_sources?: { name: string } | null;
};

type DbSource = {
  id: string;
  name: string;
  source_type: IptvSource["sourceType"];
  provider_id: string | null;
  base_url: string | null;
  source_url: string | null;
  epg_url: string | null;
  is_legal_confirmed: boolean;
  is_enabled: boolean;
  notes: string | null;
  country: string | null;
  provider_website: string | null;
  legal_contact_info: string | null;
  last_imported_at: string | null;
  last_tested_at: string | null;
  last_status: IptvSource["lastStatus"];
  providers?: { name: string } | null;
};

type DbImportLog = {
  id: string;
  iptv_source_id: string;
  import_type: ImportLog["importType"];
  status: ImportLog["status"];
  message: string | null;
  items_found: number;
  items_imported: number;
  items_updated: number;
  items_failed: number;
  created_at: string;
};

type SupabaseLikeClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function toneForSource(sourceType: SourceType) {
  switch (sourceType) {
    case "public_domain":
      return "from-emerald-500 via-slate-950 to-cyan-500";
    case "youtube":
      return "from-red-500 via-slate-950 to-amber-500";
    case "official_provider":
      return "from-sky-500 via-slate-950 to-violet-500";
    case "m3u":
      return "from-orange-500 via-slate-950 to-teal-500";
    case "xtream":
      return "from-fuchsia-500 via-slate-950 to-violet-500";
    case "other_legal":
      return "from-teal-500 via-slate-950 to-blue-500";
    case "manual":
      return "from-stone-500 via-slate-950 to-red-500";
  }
}

function backdropToneForSource(sourceType: SourceType) {
  return toneForSource(sourceType).replaceAll("-500", "-950");
}

function fallbackSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProviderType(value: string | null): ProviderType {
  if (
    value === "free_avod" ||
    value === "free_live_tv" ||
    value === "youtube" ||
    value === "public_broadcaster" ||
    value === "official_provider"
  ) {
    return value;
  }

  return "official_provider";
}

function defaultPlaybackForType(providerType: ProviderType): ProviderPlaybackType {
  return providerType === "youtube" ? "youtube_embed" : "external_link";
}

function defaultAccessForType(providerType: ProviderType): ProviderAccessType {
  switch (providerType) {
    case "free_avod":
    case "free_live_tv":
    case "youtube":
      return "no_login_required";
    case "public_broadcaster":
      return "optional_login";
    case "official_provider":
      return "unknown";
  }
}

function mapProvider(provider: DbProvider): Provider {
  const providerType = normalizeProviderType(provider.provider_type);

  return {
    id: provider.id,
    name: provider.name,
    slug: provider.slug ?? fallbackSlug(provider.name),
    websiteUrl: provider.website_url ?? "",
    logoUrl: provider.logo_url ?? undefined,
    providerType,
    defaultPlaybackType:
      provider.default_playback_type ?? defaultPlaybackForType(providerType),
    defaultAccessType:
      provider.default_access_type ?? defaultAccessForType(providerType),
    countryAvailability: provider.country_availability ?? [],
    isEnabled: provider.is_enabled ?? true,
    notes: provider.notes ?? undefined,
  };
}

function mapMediaLink(link: DbMediaLink): MediaProviderLink {
  return {
    id: link.id,
    mediaItemId: link.media_item_id,
    providerId: link.provider_id ?? undefined,
    iptvSourceId: link.iptv_source_id ?? undefined,
    providerName:
      link.providers?.name ?? link.iptv_sources?.name ?? "Unknown provider",
    providerSlug: link.providers?.slug ?? undefined,
    providerLogoUrl: link.providers?.logo_url ?? undefined,
    watchUrl: link.watch_url ?? undefined,
    playbackType: link.playback_type,
    accessType: link.access_type,
    sourceType: link.source_type,
    youtubeVideoId: link.youtube_video_id ?? undefined,
    embedUrl: link.embed_url ?? undefined,
    videoUrl: link.video_url ?? undefined,
    streamUrl: link.stream_url ?? undefined,
    xtreamStreamId: link.xtream_stream_id ?? undefined,
    isFree: link.is_free,
    isLegalConfirmed: link.is_legal_confirmed,
    availabilityCountry: link.availability_country ?? [],
    notes: link.notes ?? undefined,
    expiresAt: link.expires_at ?? undefined,
    lastCheckedAt: link.last_checked_at ?? undefined,
  };
}

function mapMediaItem(item: DbMediaItem): MediaItem {
  return {
    id: item.id,
    tmdbId: item.tmdb_id ?? undefined,
    mediaType: item.media_type,
    title: item.title,
    originalTitle: item.original_title ?? undefined,
    overview: item.overview ?? "",
    posterTone: toneForSource(item.source_type),
    backdropTone: backdropToneForSource(item.source_type),
    releaseDate: item.release_date ?? undefined,
    runtime: item.runtime ?? undefined,
    numberOfSeasons: item.number_of_seasons ?? undefined,
    genres: item.genres ?? [],
    originalLanguage: item.original_language ?? "Unknown",
    originCountry: item.origin_country ?? [],
    popularity: Number(item.popularity ?? 0),
    voteAverage: Number(item.vote_average ?? 0),
    sourceType: item.source_type,
    importStatus: item.import_status,
    legalReviewNotes: item.legal_review_notes ?? undefined,
    addedAt: item.created_at.slice(0, 10),
    providerLinks: (item.media_provider_links ?? []).map(mapMediaLink),
  };
}

function mapLiveChannel(channel: DbLiveChannel): LiveChannel {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description ?? "",
    logoTone: toneForSource(channel.source_type).replace("via-slate-950 ", ""),
    category: channel.category ?? "Uncategorized",
    country: channel.country ?? "Unknown",
    language: channel.language ?? "Unknown",
    providerName:
      channel.providers?.name ?? channel.iptv_sources?.name ?? "Unknown provider",
    iptvSourceId: channel.iptv_source_id ?? undefined,
    watchUrl: channel.watch_url ?? undefined,
    playbackType: channel.playback_type,
    accessType: channel.access_type,
    sourceType: channel.source_type,
    embedUrl: channel.embed_url ?? undefined,
    streamUrl: channel.stream_url ?? undefined,
    tvgId: channel.tvg_id ?? undefined,
    tvgName: channel.tvg_name ?? undefined,
    tvgLogo: channel.tvg_logo ?? undefined,
    groupTitle: channel.group_title ?? undefined,
    xtreamStreamId: channel.xtream_stream_id ?? undefined,
    xtreamCategoryId: channel.xtream_category_id ?? undefined,
    isFree: channel.is_free,
    isLegalConfirmed: channel.is_legal_confirmed,
    importStatus: channel.import_status,
    legalReviewNotes: channel.legal_review_notes ?? undefined,
    lastCheckedAt: channel.last_checked_at ?? undefined,
  };
}

function mapSource(source: DbSource): IptvSource {
  return {
    id: source.id,
    name: source.name,
    sourceType: source.source_type,
    providerName: source.providers?.name ?? source.name,
    baseUrl: source.base_url ?? undefined,
    sourceUrl: source.source_url ?? undefined,
    epgUrl: source.epg_url ?? undefined,
    isLegalConfirmed: source.is_legal_confirmed,
    isEnabled: source.is_enabled,
    notes: source.notes ?? "",
    country: source.country ?? "Unknown",
    providerWebsite: source.provider_website ?? undefined,
    legalContactInfo: source.legal_contact_info ?? undefined,
    lastImportedAt: source.last_imported_at ?? "Never",
    lastTestedAt: source.last_tested_at ?? "Never",
    lastStatus: source.last_status,
    importedItems: 0,
  };
}

function mockStatsForSource(sourceId: string): M3UChannelStats {
  const channels = mockLiveChannels.filter(
    (channel) =>
      channel.sourceType === "m3u" &&
      (channel.iptvSourceId === sourceId ||
        (!channel.iptvSourceId &&
          (sourceId === "source-m3u-demo" || sourceId === "source-manual-upload"))),
  );

  return {
    total: channels.length,
    pending: channels.filter((channel) => channel.importStatus === "pending_review")
      .length,
    approved: channels.filter((channel) => channel.importStatus === "approved")
      .length,
    rejected: channels.filter((channel) => channel.importStatus === "rejected")
      .length,
  };
}

async function countM3UChannels(
  supabase: NonNullable<SupabaseLikeClient>,
  sourceId: string,
  status?: "pending_review" | "approved" | "rejected",
) {
  let query = supabase
    .from("live_channels")
    .select("id", { count: "exact", head: true })
    .eq("iptv_source_id", sourceId)
    .eq("source_type", "m3u");

  if (status) query = query.eq("import_status", status);

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function getM3UChannelStatsForClient(
  supabase: NonNullable<SupabaseLikeClient>,
  sourceId: string,
): Promise<M3UChannelStats> {
  const [total, pending, approved, rejected] = await Promise.all([
    countM3UChannels(supabase, sourceId),
    countM3UChannels(supabase, sourceId, "pending_review"),
    countM3UChannels(supabase, sourceId, "approved"),
    countM3UChannels(supabase, sourceId, "rejected"),
  ]);

  return { total, pending, approved, rejected };
}

async function attachM3UStats(
  supabase: NonNullable<SupabaseLikeClient>,
  sources: IptvSource[],
) {
  return Promise.all(
    sources.map(async (source) => {
      if (!["m3u_url", "m3u_file"].includes(source.sourceType)) return source;
      const channelStats = await getM3UChannelStatsForClient(supabase, source.id);
      return {
        ...source,
        importedItems: channelStats.total,
        channelStats,
      };
    }),
  );
}

function mapImportLog(log: DbImportLog): ImportLog {
  return {
    id: log.id,
    iptvSourceId: log.iptv_source_id,
    importType: log.import_type,
    status: log.status,
    message: log.message ?? "",
    itemsFound: log.items_found,
    itemsImported: log.items_imported,
    itemsUpdated: log.items_updated,
    itemsFailed: log.items_failed,
    createdAt: log.created_at,
  };
}

export async function getMediaItems() {
  if (!isSupabaseConfigured()) return mockMediaItems;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockMediaItems;

  const { data, error } = await supabase
    .from("media_items")
    .select(
      `
      *,
      media_provider_links (
        *,
        providers ( id, name, slug, logo_url ),
        iptv_sources ( name )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (!error && data) return (data as DbMediaItem[]).map(mapMediaItem);

  const { data: legacyData, error: legacyError } = await supabase
    .from("media_items")
    .select(
      `
      *,
      media_provider_links (
        *,
        providers ( id, name, logo_url ),
        iptv_sources ( name )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (legacyError || !legacyData) return mockMediaItems;
  return (legacyData as DbMediaItem[]).map(mapMediaItem);
}

export async function getProviders() {
  if (!isSupabaseConfigured()) return mockProviders;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockProviders;

  const { data, error } = await supabase
    .from("providers")
    .select(
      "id,name,slug,website_url,logo_url,provider_type,default_playback_type,default_access_type,country_availability,is_enabled,notes",
    )
    .order("name", { ascending: true });

  if (!error && data) return (data as DbProvider[]).map(mapProvider);

  const { data: legacyData, error: legacyError } = await supabase
    .from("providers")
    .select("id,name,website_url,logo_url,provider_type,country_availability")
    .order("name", { ascending: true });

  if (legacyError || !legacyData) return mockProviders;
  return (legacyData as DbProvider[]).map(mapProvider);
}

export async function getLiveChannels() {
  if (!isSupabaseConfigured()) return mockLiveChannels;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockLiveChannels;

  const { data, error } = await supabase
    .from("live_channels")
    .select("*, providers ( name ), iptv_sources ( name )")
    .order("created_at", { ascending: false });

  if (error || !data) return mockLiveChannels;
  return (data as DbLiveChannel[]).map(mapLiveChannel);
}

export async function getSources() {
  if (!isSupabaseConfigured()) {
    return mockSources.map((source) =>
      ["m3u_url", "m3u_file"].includes(source.sourceType)
        ? {
            ...source,
            importedItems: mockStatsForSource(source.id).total,
            channelStats: mockStatsForSource(source.id),
          }
        : source,
    );
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockSources;

  const { data, error } = await supabase
    .from("iptv_sources")
    .select("*, providers ( name )")
    .order("created_at", { ascending: false });

  if (error || !data) return mockSources;
  return attachM3UStats(supabase, (data as DbSource[]).map(mapSource));
}

export async function getM3USources() {
  const sources = await getSources();
  return sources.filter((source) =>
    ["m3u_url", "m3u_file"].includes(source.sourceType),
  );
}

export async function getM3USource(sourceId: string) {
  const sources = await getM3USources();
  return sources.find((source) => source.id === sourceId);
}

export async function getImportLogs() {
  if (!isSupabaseConfigured()) return mockImportLogs;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockImportLogs;

  const { data, error } = await supabase
    .from("import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return mockImportLogs;
  return (data as DbImportLog[]).map(mapImportLog);
}

export async function getOwnerSettings(): Promise<OwnerSettings> {
  if (!isSupabaseConfigured()) return mockOwnerSettings;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockOwnerSettings;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return mockOwnerSettings;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "preferred_languages,preferred_countries,preferred_sources,preferred_categories,default_playback_preference,hide_unknown_access,hide_unconfirmed_sources",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return mockOwnerSettings;

  return {
    preferredLanguages: data.preferred_languages ?? [],
    preferredCountries: data.preferred_countries ?? [],
    preferredSources: data.preferred_sources ?? [],
    preferredCategories: data.preferred_categories ?? [],
    defaultPlaybackPreference: data.default_playback_preference,
    hideUnknownAccess: data.hide_unknown_access,
    hideUnconfirmedSources: data.hide_unconfirmed_sources,
    theme: "dark",
  };
}

export async function getPendingReviewItems(): Promise<ReviewQueueItem[]> {
  if (!isSupabaseConfigured()) return mockPendingReviewItems;

  const [media, channels] = await Promise.all([getMediaItems(), getLiveChannels()]);

  return [
    ...media
      .filter((item) => item.importStatus === "pending_review")
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.mediaType === "movie" ? "Movie" : "TV show",
        source: item.providerLinks[0]?.providerName ?? "Unknown",
        sourceId: item.providerLinks[0]?.iptvSourceId,
        accessType: item.providerLinks[0]?.accessType ?? "unknown",
        sourceType: item.sourceType,
        notes: item.legalReviewNotes ?? "Needs owner review.",
      })),
    ...channels
      .filter((channel) => channel.importStatus === "pending_review")
      .map((channel) => ({
        id: channel.id,
        title: channel.name,
        type: "Live channel",
        source: channel.providerName,
        sourceId: channel.iptvSourceId,
        accessType: channel.accessType,
        sourceType: channel.sourceType,
        notes: channel.legalReviewNotes ?? "Needs owner review.",
      })),
  ];
}
