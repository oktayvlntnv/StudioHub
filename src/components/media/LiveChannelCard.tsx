import Link from "next/link";
import { RadioTower } from "lucide-react";
import type { LiveChannel } from "@/types/studiohub";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface LiveChannelCardProps {
  channel: LiveChannel;
}

export function LiveChannelCard({ channel }: LiveChannelCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/25 hover:bg-white/[0.08]">
      <div className="flex items-start gap-4">
        <div
          className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${channel.logoTone}`}
        >
          <RadioTower className="size-7 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {channel.category} / {channel.country} / {channel.language}
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">{channel.name}</h3>
            </div>
            <Link
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
              href={`/watch/${channel.id}`}
            >
              Watch
            </Link>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
            {channel.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge kind="access" value={channel.accessType} />
            <StatusBadge kind="playback" value={channel.playbackType} />
            <StatusBadge kind="source" value={channel.sourceType} />
          </div>
          <p className="mt-3 text-sm text-slate-400">{channel.providerName}</p>
        </div>
      </div>
    </article>
  );
}
