import Link from "next/link";
import { ExternalLink, LockKeyhole, PlayCircle, ShieldAlert } from "lucide-react";
import type { LiveChannel, MediaItem, MediaProviderLink } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface WatchPlayerProps {
  item?: MediaItem;
  channel?: LiveChannel;
  link?: MediaProviderLink;
}

export function WatchPlayer({ item, channel, link }: WatchPlayerProps) {
  const title = item?.title ?? channel?.name ?? "Unknown item";
  const playbackType = link?.playbackType ?? channel?.playbackType;
  const accessType = link?.accessType ?? channel?.accessType;
  const sourceType = link?.sourceType ?? channel?.sourceType;
  const providerName = link?.providerName ?? channel?.providerName ?? "Unknown source";
  const watchUrl = link?.watchUrl ?? channel?.watchUrl;
  const embedUrl = link?.embedUrl ?? channel?.embedUrl;
  const videoUrl = link?.videoUrl ?? link?.streamUrl ?? channel?.streamUrl;

  if (!playbackType || !accessType || !sourceType) {
    return (
      <SafeNotice
        body="This item has no approved playback metadata yet."
        title="Playback unavailable"
      />
    );
  }

  if (playbackType === "external_link") {
    return (
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6">
        <ExternalLink className="size-8 text-cyan-100" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-white">Open official provider</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/85">
          StudioHub does not play this item inside the app because the official
          provider page is the authorized watch surface.
        </p>
        <MetaBadges
          accessType={accessType}
          playbackType={playbackType}
          sourceType={sourceType}
        />
        {watchUrl ? (
          <a
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-200 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-50"
            href={watchUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open official provider
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    );
  }

  if (playbackType === "youtube_embed" && link?.youtubeVideoId) {
    return (
      <PlayerFrame title={title}>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${link.youtubeVideoId}`}
          title={title}
        />
      </PlayerFrame>
    );
  }

  if (playbackType === "official_embed" && embedUrl) {
    return (
      <PlayerFrame title={title}>
        <iframe
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="size-full"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          src={embedUrl}
          title={title}
        />
      </PlayerFrame>
    );
  }

  if (playbackType === "xtream_stream") {
    return (
      <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-6">
        <LockKeyhole className="size-8 text-fuchsia-100" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-white">
          Owner credentials required
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-fuchsia-50/85">
          Xtream credentials stay server-side. StudioHub will not proxy, scrape,
          expose tokens, or bypass provider restrictions.
        </p>
        <MetaBadges
          accessType={accessType}
          playbackType={playbackType}
          sourceType={sourceType}
        />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <PlayerFrame title={title}>
        <video
          className="size-full bg-black"
          controls
          controlsList="nodownload"
          poster=""
          preload="metadata"
          src={videoUrl}
        />
      </PlayerFrame>
    );
  }

  return (
    <SafeNotice
      body={`No direct playback URL is exposed for ${providerName}. Use an official provider link or add a legally approved playback source.`}
      title="Safe playback notice"
    />
  );
}

function PlayerFrame({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
      <div className="aspect-video w-full">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <PlayCircle className="size-5 text-teal-200" aria-hidden="true" />
          {title}
        </div>
        <Link
          className="min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 outline-none hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-teal-300"
          href="/legal"
        >
          Legal notes
        </Link>
      </div>
    </div>
  );
}

function MetaBadges({
  accessType,
  playbackType,
  sourceType,
}: {
  accessType: NonNullable<WatchPlayerProps["link"]>["accessType"];
  playbackType: NonNullable<WatchPlayerProps["link"]>["playbackType"];
  sourceType: NonNullable<WatchPlayerProps["link"]>["sourceType"];
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <StatusBadge kind="access" value={accessType} />
      <StatusBadge kind="playback" value={playbackType} />
      <StatusBadge kind="source" value={sourceType} />
    </div>
  );
}

function SafeNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6">
      <ShieldAlert className="size-8 text-amber-100" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50/85">{body}</p>
    </div>
  );
}
