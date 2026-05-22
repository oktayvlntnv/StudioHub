"use client";

import { useMemo, useState } from "react";
import type { LiveChannel } from "@/types/studiohub";
import { accessTypeLabels, playbackTypeLabels, sourceTypeLabels } from "@/lib/labels";
import { optionList } from "@/lib/utils";
import { LiveChannelCard } from "@/components/media/LiveChannelCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface FilterableLiveGridProps {
  channels: LiveChannel[];
}

export function FilterableLiveGrid({ channels }: FilterableLiveGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [language, setLanguage] = useState("all");
  const [accessType, setAccessType] = useState("all");
  const [playbackType, setPlaybackType] = useState("all");
  const [sourceType, setSourceType] = useState("all");

  const filtered = useMemo(
    () =>
      channels
        .filter((channel) => channel.importStatus === "approved")
        .filter((channel) =>
          query.trim()
            ? channel.name.toLowerCase().includes(query.toLowerCase()) ||
              channel.description.toLowerCase().includes(query.toLowerCase())
            : true,
        )
        .filter((channel) =>
          category === "all" ? true : channel.category === category,
        )
        .filter((channel) => (country === "all" ? true : channel.country === country))
        .filter((channel) =>
          language === "all" ? true : channel.language === language,
        )
        .filter((channel) =>
          accessType === "all" ? true : channel.accessType === accessType,
        )
        .filter((channel) =>
          playbackType === "all" ? true : channel.playbackType === playbackType,
        )
        .filter((channel) =>
          sourceType === "all" ? true : channel.sourceType === sourceType,
        ),
    [accessType, category, channels, country, language, playbackType, query, sourceType],
  );

  const categories = optionList(channels.map((channel) => channel.category));
  const countries = optionList(channels.map((channel) => channel.country));
  const languages = optionList(channels.map((channel) => channel.language));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          aria-label="Search live TV"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search live channels"
          value={query}
        />
        <select
          aria-label="Category"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="Country"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setCountry(event.target.value)}
          value={country}
        >
          <option value="all">All countries</option>
          {countries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="Language"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setLanguage(event.target.value)}
          value={language}
        >
          <option value="all">All languages</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="Access type"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setAccessType(event.target.value)}
          value={accessType}
        >
          <option value="all">All access types</option>
          {Object.entries(accessTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Playback type"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setPlaybackType(event.target.value)}
          value={playbackType}
        >
          <option value="all">All playback types</option>
          {Object.entries(playbackTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Source type"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setSourceType(event.target.value)}
          value={sourceType}
        >
          <option value="all">All source types</option>
          {Object.entries(sourceTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="min-h-12 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
          onClick={() => {
            setQuery("");
            setCategory("all");
            setCountry("all");
            setLanguage("all");
            setAccessType("all");
            setPlaybackType("all");
            setSourceType("all");
          }}
          type="button"
        >
          Reset filters
        </button>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((channel) => (
            <LiveChannelCard channel={channel} key={channel.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No approved channels match"
          body="Only approved legal channels appear here. Review imported channels from Sources."
        />
      )}
    </div>
  );
}
