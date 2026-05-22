export type MediaType = "movie" | "tv";

export type AccessType =
  | "no_login_required"
  | "optional_login"
  | "login_required"
  | "owner_credentials_required"
  | "unknown";

export type PlaybackType =
  | "youtube_embed"
  | "official_embed"
  | "external_link"
  | "public_domain_video"
  | "official_live_stream"
  | "m3u_stream"
  | "xtream_stream";

export type ProviderPlaybackType = Extract<
  PlaybackType,
  "external_link" | "youtube_embed" | "official_embed"
>;

export type SourceType =
  | "official_provider"
  | "youtube"
  | "public_domain"
  | "m3u"
  | "xtream"
  | "manual"
  | "other_legal";

export type ImportStatus = "pending_review" | "approved" | "rejected";

export type SourceRecordType = "m3u_url" | "m3u_file" | "xtream" | "xmltv_epg";

export interface M3UChannelStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export type ProviderType =
  | "official_provider"
  | "free_avod"
  | "free_live_tv"
  | "public_broadcaster"
  | "youtube";

export type ProviderAccessType = Exclude<
  AccessType,
  "owner_credentials_required"
>;

export interface Provider {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl?: string;
  providerType: ProviderType;
  defaultPlaybackType: ProviderPlaybackType;
  defaultAccessType: ProviderAccessType;
  countryAvailability: string[];
  isEnabled: boolean;
  notes?: string;
}

export interface MediaProviderLink {
  id: string;
  mediaItemId?: string;
  providerId?: string;
  iptvSourceId?: string;
  providerName: string;
  providerSlug?: string;
  providerLogoUrl?: string;
  watchUrl?: string;
  playbackType: PlaybackType;
  accessType: AccessType;
  sourceType: SourceType;
  youtubeVideoId?: string;
  embedUrl?: string;
  videoUrl?: string;
  streamUrl?: string;
  xtreamStreamId?: string;
  isFree: boolean;
  isLegalConfirmed: boolean;
  availabilityCountry: string[];
  notes?: string;
  expiresAt?: string;
  lastCheckedAt?: string;
}

export interface MediaItem {
  id: string;
  tmdbId?: number;
  mediaType: MediaType;
  title: string;
  originalTitle?: string;
  overview: string;
  posterTone: string;
  backdropTone: string;
  releaseDate?: string;
  runtime?: number;
  numberOfSeasons?: number;
  genres: string[];
  originalLanguage: string;
  originCountry: string[];
  popularity: number;
  voteAverage: number;
  sourceType: SourceType;
  importStatus: ImportStatus;
  legalReviewNotes?: string;
  addedAt: string;
  providerLinks: MediaProviderLink[];
}

export interface LiveChannel {
  id: string;
  name: string;
  description: string;
  logoTone: string;
  category: string;
  country: string;
  language: string;
  providerName: string;
  iptvSourceId?: string;
  watchUrl?: string;
  playbackType: Exclude<PlaybackType, "youtube_embed" | "public_domain_video">;
  accessType: AccessType;
  sourceType: SourceType;
  embedUrl?: string;
  streamUrl?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  xtreamStreamId?: string;
  xtreamCategoryId?: string;
  isFree: boolean;
  isLegalConfirmed: boolean;
  importStatus: ImportStatus;
  legalReviewNotes?: string;
  lastCheckedAt?: string;
}

export interface IptvSource {
  id: string;
  name: string;
  sourceType: SourceRecordType;
  providerName: string;
  baseUrl?: string;
  sourceUrl?: string;
  epgUrl?: string;
  isLegalConfirmed: boolean;
  isEnabled: boolean;
  notes: string;
  country: string;
  providerWebsite?: string;
  legalContactInfo?: string;
  lastImportedAt?: string;
  lastTestedAt?: string;
  lastStatus: "unknown" | "success" | "failed";
  importedItems: number;
  channelStats?: M3UChannelStats;
}

export interface ImportLog {
  id: string;
  iptvSourceId: string;
  importType: "m3u" | "xtream_live" | "xtream_movies" | "xtream_series" | "epg";
  status: "started" | "success" | "failed";
  message: string;
  itemsFound: number;
  itemsImported: number;
  itemsUpdated: number;
  itemsFailed: number;
  createdAt: string;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  type: string;
  source: string;
  sourceId?: string;
  accessType: AccessType;
  sourceType: SourceType;
  notes: string;
}

export interface OwnerSettings {
  preferredLanguages: string[];
  preferredCountries: string[];
  preferredSources: string[];
  preferredCategories: string[];
  defaultPlaybackPreference: "in_app" | "official_provider";
  hideUnknownAccess: boolean;
  hideUnconfirmedSources: boolean;
  theme: "dark";
}
