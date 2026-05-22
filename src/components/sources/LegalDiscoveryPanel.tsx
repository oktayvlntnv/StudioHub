"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, Loader2, Search, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AccessType, PlaybackType, SourceType } from "@/types/studiohub";

type DiscoverySource = "youtube" | "internet_archive" | "iptv_org";

interface DiscoveryResult {
  id: string;
  source: DiscoverySource;
  title: string;
  description: string;
  providerName: string;
  mediaType: "movie" | "tv" | "live";
  sourceType: SourceType;
  playbackType: PlaybackType;
  accessType: AccessType;
  watchUrl?: string;
  videoUrl?: string;
  streamUrl?: string;
  genres: string[];
  country: string[];
  isFree: boolean;
  legalNote: string;
}

const sourceOptions: Array<{
  value: DiscoverySource;
  label: string;
  helper: string;
}> = [
  {
    value: "internet_archive",
    label: "Internet Archive",
    helper: "Public archive metadata and playable files when available.",
  },
  {
    value: "iptv_org",
    label: "IPTV-org Live TV",
    helper: "Public live TV index. Geo-blocked and custom-header streams are skipped.",
  },
  {
    value: "youtube",
    label: "YouTube Creative Commons",
    helper: "Official YouTube API. Requires YOUTUBE_API_KEY in Vercel.",
  },
];

export function LegalDiscoveryPanel() {
  const router = useRouter();
  const [source, setSource] = useState<DiscoverySource>("internet_archive");
  const [query, setQuery] = useState("public domain movie");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxResults, setMaxResults] = useState(12);
  const [autoCountry, setAutoCountry] = useState("NL");
  const [autoMaxPerPreset, setAutoMaxPerPreset] = useState(8);
  const [includeInternetArchive, setIncludeInternetArchive] = useState(true);
  const [includeIptvOrg, setIncludeIptvOrg] = useState(true);
  const [includeYouTube, setIncludeYouTube] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [approveNow, setApproveNow] = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);

  const selectedCount = selectedIds.length;
  const currentHelper = useMemo(
    () => sourceOptions.find((option) => option.value === source)?.helper,
    [source],
  );

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setStatus(null);
    setResults([]);
    setSelectedIds([]);

    try {
      const response = await fetch("/api/discovery/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          query,
          country,
          category,
          maxResults,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Discovery search failed.");
      setResults(payload.results ?? []);
      setStatus({
        kind: "success",
        message: `Found ${(payload.results ?? []).length} legal discovery candidates.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Discovery search failed.",
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function importSelected() {
    setIsImporting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/discovery/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          query,
          country,
          category,
          maxResults: Math.max(maxResults, selectedIds.length),
          selectedIds,
          importStatus: approveNow ? "approved" : "pending_review",
          isLegalConfirmed: legalConfirmed,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Discovery import failed.");
      setStatus({
        kind: "success",
        message: payload.message ?? "Discovery import completed.",
      });
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Discovery import failed.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function autoImportCatalog() {
    setIsAutoImporting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/discovery/auto-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          includeInternetArchive,
          includeIptvOrg,
          includeYouTube,
          country: autoCountry,
          maxPerPreset: autoMaxPerPreset,
          importStatus: approveNow ? "approved" : "pending_review",
          isLegalConfirmed: legalConfirmed,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Auto discovery import failed.");
      }
      setStatus({
        kind: "success",
        message:
          payload.message ??
          "Auto discovery finished. Review imported items before they appear in the catalog.",
      });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Auto discovery import failed.",
      });
    } finally {
      setIsAutoImporting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Legal discovery</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Find free candidates from official APIs and public catalog feeds. StudioHub
            does not scrape Plex, Tubi, Pluto, or protected provider pages; those stay as
            official external links unless you have a provider-approved catalog export.
          </p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
          Import as pending review by default.
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Auto-fill starter catalog
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-teal-50/85">
              Runs several legal discovery searches for public archive movies and public
              live TV listings. YouTube is included only when a YouTube API key is set.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
            disabled={
              isAutoImporting ||
              (!includeInternetArchive && !includeIptvOrg && !includeYouTube) ||
              (approveNow && !legalConfirmed)
            }
            onClick={autoImportCatalog}
            type="button"
          >
            {isAutoImporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <DatabaseZap className="size-4" aria-hidden="true" />
            )}
            {isAutoImporting ? "Filling..." : "Auto-fill catalog"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_90px_110px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white">
            <input
              checked={includeInternetArchive}
              className="size-4 accent-teal-300"
              onChange={(event) => setIncludeInternetArchive(event.target.checked)}
              type="checkbox"
            />
            Internet Archive
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white">
            <input
              checked={includeIptvOrg}
              className="size-4 accent-teal-300"
              onChange={(event) => setIncludeIptvOrg(event.target.checked)}
              type="checkbox"
            />
            IPTV-org Live TV
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white">
            <input
              checked={includeYouTube}
              className="size-4 accent-teal-300"
              onChange={(event) => setIncludeYouTube(event.target.checked)}
              type="checkbox"
            />
            YouTube API
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-50/70">
              Country
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 uppercase text-white outline-none placeholder:text-teal-50/40 focus:border-teal-200/60"
              maxLength={2}
              onChange={(event) => setAutoCountry(event.target.value.toUpperCase())}
              placeholder="NL"
              value={autoCountry}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-50/70">
              Per search
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-teal-200/60"
              max={25}
              min={3}
              onChange={(event) => setAutoMaxPerPreset(Number(event.target.value))}
              type="number"
              value={autoMaxPerPreset}
            />
          </label>
        </div>
      </div>

      <form className="grid gap-3 lg:grid-cols-[220px_1fr_110px_150px_110px_auto]" onSubmit={search}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Source
          </span>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            onChange={(event) => setSource(event.target.value as DiscoverySource)}
            value={source}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Query
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="movie, documentary, news"
            value={query}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Country
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 uppercase text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            maxLength={2}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
            placeholder="NL"
            value={country}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Category
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="news"
            value={category}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Limit
          </span>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
            max={50}
            min={1}
            onChange={(event) => setMaxResults(Number(event.target.value))}
            type="number"
            value={maxResults}
          />
        </label>
        <button
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {currentHelper ? (
        <p className="text-sm leading-6 text-slate-400">{currentHelper}</p>
      ) : null}

      {status ? (
        <p
          className={
            status.kind === "success"
              ? "rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"
              : "rounded-xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
          }
        >
          {status.message}
        </p>
      ) : null}

      {results.length ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-start gap-3 text-sm leading-6 text-slate-200">
              <input
                checked={legalConfirmed}
                className="mt-1 size-4 accent-teal-300"
                onChange={(event) => setLegalConfirmed(event.target.checked)}
                type="checkbox"
              />
              I confirm the selected items are legal and I am authorized to add them.
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
              <input
                checked={approveNow}
                className="size-4 accent-teal-300"
                onChange={(event) => setApproveNow(event.target.checked)}
                type="checkbox"
              />
              Import as approved
            </label>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 outline-none transition enabled:hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-100"
              disabled={
                isImporting ||
                selectedCount === 0 ||
                (approveNow && !legalConfirmed)
              }
              onClick={importSelected}
              type="button"
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <DatabaseZap className="size-4" aria-hidden="true" />
              )}
              {isImporting ? "Importing..." : `Import selected (${selectedCount})`}
            </button>
          </div>

          <div className="grid gap-3">
            {results.map((result) => (
              <article
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                key={result.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <label className="flex min-w-0 items-start gap-3">
                    <input
                      checked={selectedIds.includes(result.id)}
                      className="mt-1 size-4 shrink-0 accent-teal-300"
                      onChange={(event) =>
                        toggleSelected(result.id, event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-white">
                        {result.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-6 text-slate-300">
                        {result.description}
                      </span>
                      <span className="mt-2 block text-xs uppercase tracking-wide text-slate-500">
                        {result.providerName} / {result.mediaType}
                      </span>
                    </span>
                  </label>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <StatusBadge kind="access" value={result.accessType} />
                    <StatusBadge kind="playback" value={result.playbackType} />
                    <StatusBadge kind="source" value={result.sourceType} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {result.isFree ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                      Free
                    </span>
                  ) : null}
                  {result.country.map((countryCode) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300"
                      key={countryCode}
                    >
                      {countryCode}
                    </span>
                  ))}
                  {result.genres.slice(0, 4).map((genre) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300"
                      key={genre}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  <ShieldCheck className="mr-1 inline size-3" aria-hidden="true" />
                  {result.legalNote}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
