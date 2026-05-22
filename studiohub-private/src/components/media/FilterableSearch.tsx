"use client";

import { useMemo, useState } from "react";
import type { LiveChannel, MediaItem } from "@/types/studiohub";
import { MediaCard } from "@/components/media/MediaCard";
import { LiveChannelCard } from "@/components/media/LiveChannelCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { optionList } from "@/lib/utils";

interface FilterableSearchProps {
  media: MediaItem[];
  channels: LiveChannel[];
}

export function FilterableSearch({ media, channels }: FilterableSearchProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [provider, setProvider] = useState("all");

  const mediaResults = useMemo(
    () =>
      media
        .filter((item) => item.importStatus === "approved")
        .filter((item) => (type === "all" ? true : item.mediaType === type))
        .filter((item) =>
          provider === "all"
            ? true
            : item.providerLinks.some((link) => link.providerName === provider),
        )
        .filter((item) =>
          query.trim()
            ? `${item.title} ${item.overview} ${item.genres.join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase())
            : true,
        ),
    [media, provider, query, type],
  );

  const channelResults = useMemo(
    () =>
      channels
        .filter((channel) => channel.importStatus === "approved")
        .filter(() => type === "all" || type === "live")
        .filter((channel) =>
          provider === "all" ? true : channel.providerName === provider,
        )
        .filter((channel) =>
          query.trim()
            ? `${channel.name} ${channel.description} ${channel.category}`
                .toLowerCase()
                .includes(query.toLowerCase())
            : true,
        ),
    [channels, provider, query, type],
  );

  const providers = optionList([
    ...media.flatMap((item) => item.providerLinks.map((link) => link.providerName)),
    ...channels.map((channel) => channel.providerName),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_220px_240px]">
        <input
          aria-label="Global search"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies, TV shows, and live channels"
          value={query}
        />
        <select
          aria-label="Result type"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
          <option value="live">Live channels</option>
        </select>
        <select
          aria-label="Provider"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setProvider(event.target.value)}
          value={provider}
        >
          <option value="all">All providers</option>
          {providers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {mediaResults.length ? (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Titles</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {mediaResults.map((item) => (
              <MediaCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}

      {channelResults.length ? (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Live channels</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {channelResults.map((channel) => (
              <LiveChannelCard channel={channel} key={channel.id} />
            ))}
          </div>
        </section>
      ) : null}

      {!mediaResults.length && !channelResults.length ? (
        <EmptyState
          title="No approved results"
          body="Search only includes owner-approved legal sources in this mock MVP."
        />
      ) : null}
    </div>
  );
}
