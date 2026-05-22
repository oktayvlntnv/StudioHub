import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { MediaItem } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPrimaryLink, getYear } from "@/lib/utils";

interface MediaCardProps {
  item: MediaItem;
}

export function MediaCard({ item }: MediaCardProps) {
  const primary = getPrimaryLink(item);

  return (
    <Link
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
      href={`/title/${item.id}`}
    >
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/20 transition duration-200 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:bg-white/[0.08]">
        <div
          className={`relative aspect-[2/3] bg-gradient-to-br ${item.posterTone}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.72))]" />
          <div className="absolute left-3 right-3 top-3 flex justify-between gap-2">
            <StatusBadge kind="source" value={item.sourceType} />
            <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/15 bg-black/35 px-3 text-xs font-semibold text-white backdrop-blur">
              <Star className="size-3.5 fill-amber-200 text-amber-200" />
              {item.voteAverage ? item.voteAverage.toFixed(1) : "New"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              {item.mediaType === "movie" ? "Movie" : "TV Show"} • {getYear(item.releaseDate)}
            </p>
            <h3 className="mt-2 line-clamp-2 text-xl font-bold text-white">
              {item.title}
            </h3>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="access" value={primary.accessType} />
            <StatusBadge kind="playback" value={primary.playbackType} />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
            <span className="line-clamp-1">{primary.providerName}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-teal-100">
              <Play className="size-4" aria-hidden="true" />
              Details
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
