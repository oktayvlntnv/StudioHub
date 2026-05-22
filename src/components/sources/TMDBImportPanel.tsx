"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

interface TmdbResult {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  releaseDate: string | null;
}

export function TMDBImportPanel() {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const response = await fetch(
      `/api/tmdb/search?q=${encodeURIComponent(query)}&type=${mediaType}`,
    );
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error ?? "TMDB search failed.");
      return;
    }
    setResults(result.results ?? []);
  }

  async function importResult(result: TmdbResult) {
    const response = await fetch("/api/tmdb/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tmdbId: result.tmdbId, mediaType: result.mediaType }),
    });
    const payload = await response.json();
    setStatus(payload.message ?? payload.error ?? "Import completed.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <h2 className="text-xl font-bold text-white">TMDB metadata import</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        TMDB is metadata only. Imported items stay pending review until the owner
        adds a legal source link.
      </p>
      <form className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_auto]" onSubmit={search}>
        <input
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-slate-500 focus:border-teal-300/50"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search TMDB"
          required
          value={query}
        />
        <select
          className="min-h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-teal-300/50"
          onChange={(event) => setMediaType(event.target.value as "movie" | "tv")}
          value={mediaType}
        >
          <option value="movie">Movie</option>
          <option value="tv">TV show</option>
        </select>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 text-sm font-bold text-slate-950 outline-none transition hover:bg-teal-200 focus-visible:ring-2 focus-visible:ring-teal-100"
          type="submit"
        >
          <Search className="size-4" aria-hidden="true" />
          Search
        </button>
      </form>
      {status ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
          {status}
        </p>
      ) : null}
      {results.length ? (
        <div className="mt-5 grid gap-3">
          {results.slice(0, 6).map((result) => (
            <div
              className="rounded-xl border border-white/10 bg-black/20 p-4"
              key={`${result.mediaType}-${result.tmdbId}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{result.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {result.mediaType} {result.releaseDate ? `/ ${result.releaseDate}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                    {result.overview || "No overview available."}
                  </p>
                </div>
                <button
                  className="min-h-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white outline-none transition hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-teal-300"
                  onClick={() => importResult(result)}
                  type="button"
                >
                  Import metadata
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
