import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrivateShell } from "@/components/layout/PrivateShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WatchPlayer } from "@/components/watch/WatchPlayer";
import { getLiveChannels, getMediaItems } from "@/lib/data/catalog";
import { getPrimaryLink } from "@/lib/utils";

interface WatchPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ linkId?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps) {
  const { id } = await params;
  const [mediaItems, liveChannels] = await Promise.all([
    getMediaItems(),
    getLiveChannels(),
  ]);
  const item =
    mediaItems.find((entry) => entry.id === id) ??
    liveChannels.find((entry) => entry.id === id);
  return {
    title: item ? `Watch ${"title" in item ? item.title : item.name}` : "Watch",
  };
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { id } = await params;
  const selectedLinkId = (await searchParams)?.linkId;
  const [mediaItems, liveChannels] = await Promise.all([
    getMediaItems(),
    getLiveChannels(),
  ]);
  const media = mediaItems.find((entry) => entry.id === id);
  const channel = liveChannels.find((entry) => entry.id === id);

  if (!media && !channel) notFound();

  const link = media
    ? media.providerLinks.find((entry) => entry.id === selectedLinkId) ??
      getPrimaryLink(media)
    : undefined;
  const title = media?.title ?? channel?.name ?? "Watch";
  const description = media?.overview ?? channel?.description;
  const sourceType = link?.sourceType ?? channel?.sourceType;
  const accessType = link?.accessType ?? channel?.accessType;
  const playbackType = link?.playbackType ?? channel?.playbackType;

  return (
    <PrivateShell>
      <div className="space-y-6">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-slate-200 outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
          href={media ? `/title/${media.id}` : "/live-tv"}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
            Watch mode
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              {description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {accessType ? <StatusBadge kind="access" value={accessType} /> : null}
            {playbackType ? (
              <StatusBadge kind="playback" value={playbackType} />
            ) : null}
            {sourceType ? <StatusBadge kind="source" value={sourceType} /> : null}
          </div>
        </div>

        <WatchPlayer channel={channel} item={media} link={link} />

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-xl font-bold text-white">Safety behavior</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The watch page never extracts, downloads, proxies, or bypasses
            protected streams. Unknown or credentialed sources stay in safe notice
            states until server-side legal access is implemented.
          </p>
        </section>
      </div>
    </PrivateShell>
  );
}
