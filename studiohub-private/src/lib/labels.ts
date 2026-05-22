import type { AccessType, PlaybackType, SourceType } from "@/types/studiohub";

export const accessTypeLabels: Record<AccessType, string> = {
  no_login_required: "No login",
  optional_login: "Optional login",
  login_required: "Provider login",
  owner_credentials_required: "Owner credentials",
  unknown: "Unknown access",
};

export const playbackTypeLabels: Record<PlaybackType, string> = {
  youtube_embed: "YouTube embed",
  official_embed: "Official embed",
  external_link: "External link",
  public_domain_video: "Public-domain video",
  official_live_stream: "Official live stream",
  m3u_stream: "Legal M3U stream",
  xtream_stream: "Legal Xtream stream",
};

export const sourceTypeLabels: Record<SourceType, string> = {
  official_provider: "Official provider",
  youtube: "YouTube",
  public_domain: "Public domain",
  m3u: "M3U",
  xtream: "Xtream",
  manual: "Manual",
  other_legal: "Other legal",
};

export function accessTone(accessType: AccessType) {
  switch (accessType) {
    case "no_login_required":
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
    case "optional_login":
      return "border-sky-300/30 bg-sky-300/10 text-sky-100";
    case "login_required":
      return "border-amber-300/35 bg-amber-300/10 text-amber-100";
    case "owner_credentials_required":
      return "border-rose-300/35 bg-rose-300/10 text-rose-100";
    case "unknown":
      return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  }
}

export function playbackTone(playbackType: PlaybackType) {
  switch (playbackType) {
    case "external_link":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
    case "youtube_embed":
      return "border-red-300/30 bg-red-300/10 text-red-100";
    case "official_embed":
      return "border-violet-300/30 bg-violet-300/10 text-violet-100";
    case "public_domain_video":
      return "border-lime-300/30 bg-lime-300/10 text-lime-100";
    case "official_live_stream":
      return "border-teal-300/30 bg-teal-300/10 text-teal-100";
    case "m3u_stream":
      return "border-orange-300/30 bg-orange-300/10 text-orange-100";
    case "xtream_stream":
      return "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100";
  }
}

export function sourceTone(sourceType: SourceType) {
  switch (sourceType) {
    case "official_provider":
      return "border-blue-300/30 bg-blue-300/10 text-blue-100";
    case "youtube":
      return "border-red-300/30 bg-red-300/10 text-red-100";
    case "public_domain":
      return "border-lime-300/30 bg-lime-300/10 text-lime-100";
    case "m3u":
      return "border-orange-300/30 bg-orange-300/10 text-orange-100";
    case "xtream":
      return "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100";
    case "manual":
      return "border-slate-300/25 bg-slate-300/10 text-slate-200";
    case "other_legal":
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }
}
