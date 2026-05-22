import { z } from "zod";
import { assertServerSecret, isTmdbConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";

export const tmdbSearchSchema = z.object({
  query: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
});

export const tmdbImportSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
});

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

async function tmdbFetch<T>(path: string, params?: Record<string, string>) {
  if (!isTmdbConfigured()) {
    throw new Error("TMDB_API_KEY is not configured.");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const apiKey = assertServerSecret("TMDB_API_KEY");
  const usesBearerToken = apiKey.includes(".") || apiKey.startsWith("ey");
  if (!usesBearerToken) {
    url.searchParams.set("api_key", apiKey);
  }

  const response = await fetch(url, {
    headers: {
      ...(usesBearerToken ? { Authorization: `Bearer ${apiKey}` } : {}),
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("TMDB request failed.");
  }

  return response.json() as Promise<T>;
}

interface TmdbSearchResponse {
  results: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    original_language?: string;
    origin_country?: string[];
    popularity?: number;
    vote_average?: number;
  }>;
}

interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  genres?: Array<{ name: string }>;
  original_language?: string;
  origin_country?: string[];
  production_countries?: Array<{ iso_3166_1: string }>;
  popularity?: number;
  vote_average?: number;
  videos?: {
    results?: Array<{
      key: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  };
}

export async function searchTmdb(input: z.infer<typeof tmdbSearchSchema>) {
  const payload = tmdbSearchSchema.parse(input);
  const data = await tmdbFetch<TmdbSearchResponse>(`/search/${payload.mediaType}`, {
    query: payload.query,
    include_adult: "false",
  });

  return data.results.map((item) => ({
    tmdbId: item.id,
    mediaType: payload.mediaType,
    title: item.title ?? item.name ?? "Untitled",
    overview: item.overview ?? "",
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : null,
    releaseDate: item.release_date ?? item.first_air_date ?? null,
    originalLanguage: item.original_language ?? null,
    originCountry: item.origin_country ?? [],
    popularity: item.popularity ?? 0,
    voteAverage: item.vote_average ?? 0,
  }));
}

export async function fetchTmdbDetails(input: z.infer<typeof tmdbImportSchema>) {
  const payload = tmdbImportSchema.parse(input);
  return tmdbFetch<TmdbDetails>(`/${payload.mediaType}/${payload.tmdbId}`, {
    append_to_response: "videos",
  });
}

export async function importTmdbMetadata(input: z.infer<typeof tmdbImportSchema>) {
  const payload = tmdbImportSchema.parse(input);
  const details = await fetchTmdbDetails(payload);

  const trailer = details.videos?.results?.find(
    (video) =>
      video.site === "YouTube" && video.official && video.type === "Trailer",
  );

  const item = {
    tmdb_id: details.id,
    media_type: payload.mediaType,
    title: details.title ?? details.name ?? "Untitled",
    original_title: details.original_title ?? details.original_name ?? null,
    overview: details.overview ?? null,
    poster_path: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
    backdrop_path: details.backdrop_path
      ? `${TMDB_IMAGE_BASE}${details.backdrop_path}`
      : null,
    release_date: details.release_date ?? details.first_air_date ?? null,
    runtime: details.runtime ?? null,
    number_of_seasons: details.number_of_seasons ?? null,
    genres: details.genres?.map((genre) => genre.name) ?? [],
    original_language: details.original_language ?? null,
    origin_country:
      details.origin_country ??
      details.production_countries?.map((country) => country.iso_3166_1) ??
      [],
    popularity: details.popularity ?? 0,
    vote_average: details.vote_average ?? 0,
    source_type: "manual",
    import_status: "pending_review",
    legal_review_notes:
      "Imported from TMDB metadata only. Owner must add a legal playback source.",
  };

  if (!isSupabaseAdminConfigured()) {
    return {
      item,
      trailer,
      message:
        "Fetched TMDB metadata. Configure Supabase admin credentials to save imports.",
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const { data, error } = await admin
    .from("media_items")
    .insert(item)
    .select("id,title")
    .single();

  if (error) throw new Error(error.message);

  return {
    item: data,
    trailer,
    message: "Imported TMDB metadata as pending review.",
  };
}
