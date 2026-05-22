"use client";

import { useMemo, useState } from "react";
import type { MediaItem, MediaType } from "@/types/studiohub";
import { playbackTypeLabels, sourceTypeLabels } from "@/lib/labels";
import { getPrimaryLink, getYear, optionList } from "@/lib/utils";
import { MediaCard } from "@/components/media/MediaCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface FilterableMediaGridProps {
  items: MediaItem[];
  mediaType: MediaType;
}

export function FilterableMediaGrid({
  items,
  mediaType,
}: FilterableMediaGridProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [country, setCountry] = useState("all");
  const [language, setLanguage] = useState("all");
  const [provider, setProvider] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [playbackType, setPlaybackType] = useState("all");
  const [sort, setSort] = useState("recently_added");

  const filteredItems = useMemo(() => {
    const result = items
      .filter((item) => item.mediaType === mediaType)
      .filter((item) => item.importStatus === "approved")
      .filter((item) =>
        query.trim()
          ? item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.overview.toLowerCase().includes(query.toLowerCase())
          : true,
      )
      .filter((item) => (genre === "all" ? true : item.genres.includes(genre)))
      .filter((item) =>
        country === "all" ? true : item.originCountry.includes(country),
      )
      .filter((item) =>
        language === "all" ? true : item.originalLanguage === language,
      )
      .filter((item) =>
        provider === "all"
          ? true
          : item.providerLinks.some((link) => link.providerName === provider),
      )
      .filter((item) =>
        sourceType === "all" ? true : item.sourceType === sourceType,
      )
      .filter((item) =>
        playbackType === "all"
          ? true
          : getPrimaryLink(item).playbackType === playbackType,
      );

    return result.sort((a, b) => {
      if (sort === "popular") return b.popularity - a.popularity;
      if (sort === "rating") return b.voteAverage - a.voteAverage;
      if (sort === "newest")
        return getYear(b.releaseDate).localeCompare(getYear(a.releaseDate));
      return b.addedAt.localeCompare(a.addedAt);
    });
  }, [
    country,
    genre,
    items,
    language,
    mediaType,
    playbackType,
    provider,
    query,
    sort,
    sourceType,
  ]);

  const typeItems = items.filter((item) => item.mediaType === mediaType);
  const genres = optionList(typeItems.flatMap((item) => item.genres));
  const countries = optionList(typeItems.flatMap((item) => item.originCountry));
  const languages = optionList(typeItems.map((item) => item.originalLanguage));
  const providers = optionList(
    typeItems.flatMap((item) => item.providerLinks.map((link) => link.providerName)),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          aria-label="Search catalog"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${mediaType === "movie" ? "movies" : "TV shows"}`}
          value={query}
        />
        <select
          aria-label="Genre"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setGenre(event.target.value)}
          value={genre}
        >
          <option value="all">All genres</option>
          {genres.map((item) => (
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
        <select
          aria-label="Sort"
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setSort(event.target.value)}
          value={sort}
        >
          <option value="recently_added">Recently added</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="rating">Rating</option>
        </select>
        <button
          className="min-h-12 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
          onClick={() => {
            setQuery("");
            setGenre("all");
            setCountry("all");
            setLanguage("all");
            setProvider("all");
            setSourceType("all");
            setPlaybackType("all");
            setSort("recently_added");
          }}
          type="button"
        >
          Reset filters
        </button>
      </div>

      {filteredItems.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MediaCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No approved titles match"
          body="Try changing filters or approving more legal sources from the review queue."
        />
      )}
    </div>
  );
}
