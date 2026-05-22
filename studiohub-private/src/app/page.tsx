import Link from "next/link";
import {
  Clapperboard,
  MonitorPlay,
  PlayCircle,
  Settings,
  SlidersHorizontal,
  Tv,
} from "lucide-react";
import { PrivateShell } from "@/components/layout/PrivateShell";
import { SearchBar } from "@/components/SearchBar";
import { ContentCarousel } from "@/components/media/ContentCarousel";
import { LiveChannelCard } from "@/components/media/LiveChannelCard";
import { SourceStatusCard } from "@/components/sources/SourceStatusCard";
import { getLiveChannels, getMediaItems, getSources } from "@/lib/data/catalog";

const quickLinks = [
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/tv-shows", label: "TV Shows", icon: MonitorPlay },
  { href: "/live-tv", label: "Live TV", icon: Tv },
  { href: "/sources", label: "Sources", icon: SlidersHorizontal },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function Home() {
  const [mediaItems, liveChannels, sources] = await Promise.all([
    getMediaItems(),
    getLiveChannels(),
    getSources(),
  ]);
  const approvedMedia = mediaItems.filter(
    (item) => item.importStatus === "approved",
  );
  const approvedLiveChannels = liveChannels.filter(
    (channel) => channel.importStatus === "approved",
  );
  const recentMovies = approvedMedia
    .filter((item) => item.mediaType === "movie")
    .slice(0, 4);
  const recentShows = approvedMedia
    .filter((item) => item.mediaType === "tv")
    .slice(0, 4);

  return (
    <PrivateShell>
      <div className="space-y-10">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05]">
          <div className="grid min-h-[460px] gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                  Private legal library
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-bold text-white sm:text-5xl">
                  StudioHub Private
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                  Owner-only streaming dashboard for legal sources, public-domain
                  media, official embeds, provider links, and reviewed IPTV metadata.
                </p>
              </div>
              <SearchBar placeholder="Search your approved private catalog" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      className="flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-4 outline-none transition hover:border-teal-300/40 hover:bg-teal-300/10 focus-visible:ring-2 focus-visible:ring-teal-300"
                      href={item.href}
                      key={item.href}
                    >
                      <Icon className="size-6 text-teal-100" aria-hidden="true" />
                      <span className="text-sm font-bold text-white">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="relative min-h-80 rounded-3xl border border-white/10 bg-[#0c1118] p-4">
              <div className="absolute inset-4 rounded-2xl bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(244,114,182,0.16),rgba(56,189,248,0.14))]" />
              <div className="relative flex h-full flex-col justify-end rounded-2xl border border-white/10 bg-black/35 p-6">
                <PlayCircle className="size-12 text-teal-100" aria-hidden="true" />
                <h2 className="mt-5 text-2xl font-bold text-white">
                  Continue watching
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Placeholder state ready for watch history once authentication and
                  persistence are connected.
                </p>
                <div className="mt-5 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-1/3 rounded-full bg-teal-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <ContentCarousel items={recentMovies} title="Recently added movies" />
        <ContentCarousel items={recentShows} title="Recently added TV shows" />

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Live TV</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {approvedLiveChannels.slice(0, 2).map((channel) => (
              <LiveChannelCard channel={channel} key={channel.id} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Source status</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {sources.map((source) => (
              <SourceStatusCard source={source} key={source.id} />
            ))}
          </div>
        </section>
      </div>
    </PrivateShell>
  );
}
