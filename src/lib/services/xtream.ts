import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";

export const xtreamSourceSchema = z.object({
  name: z.string().min(2).max(120),
  baseUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  notes: z.string().optional(),
  country: z.string().optional(),
  providerWebsite: z.string().url().optional().or(z.literal("")),
  legalContactInfo: z.string().optional(),
  isLegalConfirmed: z.literal(true),
});

export const xtreamSourceIdSchema = z.object({
  sourceId: z.string().min(1),
});

type XtreamCategory = {
  category_id: string;
  category_name: string;
};

type XtreamLiveStream = {
  stream_id: number;
  name: string;
  stream_icon?: string;
  category_id?: string;
  epg_channel_id?: string;
};

type XtreamVodStream = {
  stream_id: number;
  name: string;
  stream_icon?: string;
  category_id?: string;
  rating?: string;
  added?: string;
};

type XtreamSeriesStream = {
  series_id: number;
  name: string;
  cover?: string;
  category_id?: string;
  rating?: string;
};

function apiUrl(baseUrl: string, username: string, password: string, action?: string) {
  const url = new URL("/player_api.php", baseUrl);
  url.searchParams.set("username", username);
  url.searchParams.set("password", password);
  if (action) url.searchParams.set("action", action);
  return url;
}

async function xtreamFetch<T>(
  baseUrl: string,
  username: string,
  password: string,
  action?: string,
) {
  const response = await fetch(apiUrl(baseUrl, username, password, action), {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Xtream provider request failed.");
  }

  return response.json() as Promise<T>;
}

async function getStoredSource(sourceId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const { data, error } = await admin
    .from("iptv_sources")
    .select("id,name,base_url,username_encrypted,password_encrypted")
    .eq("id", sourceId)
    .eq("source_type", "xtream")
    .single();

  if (error || !data) throw new Error("Xtream source was not found.");
  if (!data.base_url || !data.username_encrypted || !data.password_encrypted) {
    throw new Error("Xtream source credentials are incomplete.");
  }

  return {
    id: data.id as string,
    name: data.name as string,
    baseUrl: data.base_url as string,
    username: decryptSecret(data.username_encrypted as string),
    password: decryptSecret(data.password_encrypted as string),
  };
}

export async function createXtreamSource(
  input: z.infer<typeof xtreamSourceSchema>,
) {
  const payload = xtreamSourceSchema.parse(input);

  if (!isSupabaseAdminConfigured()) {
    return {
      id: "mock-xtream-source",
      message:
        "Validated Xtream source in mock mode. Configure Supabase to save encrypted credentials.",
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const { data, error } = await admin
    .from("iptv_sources")
    .insert({
      name: payload.name,
      source_type: "xtream",
      base_url: payload.baseUrl,
      username_encrypted: encryptSecret(payload.username),
      password_encrypted: encryptSecret(payload.password),
      is_legal_confirmed: true,
      is_enabled: false,
      notes: payload.notes ?? null,
      country: payload.country ?? null,
      provider_website: payload.providerWebsite || null,
      legal_contact_info: payload.legalContactInfo ?? null,
      last_status: "unknown",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    message: "Xtream source saved disabled with encrypted credentials.",
  };
}

export async function testConnection(input: z.infer<typeof xtreamSourceIdSchema>) {
  const { sourceId } = xtreamSourceIdSchema.parse(input);
  if (!isSupabaseAdminConfigured()) {
    return { ok: true, message: "Mock test passed. Supabase is not configured." };
  }

  const source = await getStoredSource(sourceId);
  const data = await xtreamFetch<{
    user_info?: { status?: string; auth?: number };
    server_info?: { url?: string };
  }>(source.baseUrl, source.username, source.password);

  const ok =
    data.user_info?.auth === 1 ||
    data.user_info?.status?.toLowerCase() === "active";

  const admin = createSupabaseAdminClient();
  await admin
    ?.from("iptv_sources")
    .update({
      last_tested_at: new Date().toISOString(),
      last_status: ok ? "success" : "failed",
    })
    .eq("id", sourceId);

  return {
    ok,
    message: ok ? "Connection succeeded." : "Provider rejected the credentials.",
  };
}

export async function fetchLiveCategories(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamCategory[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_live_categories",
  );
}

export async function fetchLiveStreams(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamLiveStream[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_live_streams",
  );
}

export async function fetchMovieCategories(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamCategory[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_vod_categories",
  );
}

export async function fetchMovieStreams(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamVodStream[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_vod_streams",
  );
}

export async function fetchSeriesCategories(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamCategory[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_series_categories",
  );
}

export async function fetchSeriesStreams(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<XtreamSeriesStream[]>(
    source.baseUrl,
    source.username,
    source.password,
    "get_series",
  );
}

export async function fetchEpg(sourceId: string) {
  const source = await getStoredSource(sourceId);
  return xtreamFetch<unknown>(
    source.baseUrl,
    source.username,
    source.password,
    "get_simple_data_table",
  );
}

export function normalizeLiveChannel(
  stream: XtreamLiveStream,
  categories: XtreamCategory[],
  sourceId: string,
) {
  return {
    name: stream.name,
    description: "Imported from verified Xtream provider. Pending owner review.",
    logo_url: stream.stream_icon ?? null,
    category:
      categories.find((category) => category.category_id === stream.category_id)
        ?.category_name ?? "Uncategorized",
    country: "Unknown",
    language: "Unknown",
    iptv_source_id: sourceId,
    playback_type: "xtream_stream",
    access_type: "owner_credentials_required",
    source_type: "xtream",
    xtream_stream_id: String(stream.stream_id),
    xtream_category_id: stream.category_id ?? null,
    is_free: false,
    is_legal_confirmed: true,
    import_status: "pending_review",
    legal_review_notes:
      "Imported from Xtream. Owner must approve before it appears in Live TV.",
  };
}

export function normalizeMovie(
  stream: XtreamVodStream,
  categories: XtreamCategory[],
  sourceId: string,
) {
  return {
    media_type: "movie",
    title: stream.name,
    overview: "Imported from verified Xtream provider. Pending owner review.",
    poster_path: stream.stream_icon ?? null,
    genres: [
      categories.find((category) => category.category_id === stream.category_id)
        ?.category_name ?? "Uncategorized",
    ],
    popularity: 0,
    vote_average: stream.rating ? Number(stream.rating) || 0 : 0,
    source_type: "xtream",
    iptv_source_id: sourceId,
    xtream_stream_id: String(stream.stream_id),
    xtream_category_id: stream.category_id ?? null,
    import_status: "pending_review",
    legal_review_notes:
      "Imported from Xtream metadata. Owner must approve and confirm legal playback.",
  };
}

export function normalizeSeries(
  stream: XtreamSeriesStream,
  categories: XtreamCategory[],
  sourceId: string,
) {
  return {
    media_type: "tv",
    title: stream.name,
    overview: "Imported from verified Xtream provider. Pending owner review.",
    poster_path: stream.cover ?? null,
    genres: [
      categories.find((category) => category.category_id === stream.category_id)
        ?.category_name ?? "Uncategorized",
    ],
    popularity: 0,
    vote_average: stream.rating ? Number(stream.rating) || 0 : 0,
    source_type: "xtream",
    iptv_source_id: sourceId,
    xtream_stream_id: String(stream.series_id),
    xtream_category_id: stream.category_id ?? null,
    import_status: "pending_review",
    legal_review_notes:
      "Imported from Xtream metadata. Owner must approve and confirm legal playback.",
  };
}

export async function importXtreamLive(sourceId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { itemsFound: 0, itemsImported: 0, message: "Mock Xtream live import." };
  }
  const [categories, streams] = await Promise.all([
    fetchLiveCategories(sourceId),
    fetchLiveStreams(sourceId),
  ]);
  const rows = streams.map((stream) => normalizeLiveChannel(stream, categories, sourceId));
  const admin = createSupabaseAdminClient();
  const { error } = await admin!.from("live_channels").insert(rows);
  if (error) throw new Error(error.message);
  await admin!.from("import_logs").insert({
    iptv_source_id: sourceId,
    import_type: "xtream_live",
    status: "success",
    message: "Xtream live import completed. Items are pending review.",
    items_found: streams.length,
    items_imported: rows.length,
  });
  return { itemsFound: streams.length, itemsImported: rows.length };
}

export async function importXtreamMovies(sourceId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { itemsFound: 0, itemsImported: 0, message: "Mock Xtream movie import." };
  }
  const [categories, streams] = await Promise.all([
    fetchMovieCategories(sourceId),
    fetchMovieStreams(sourceId),
  ]);
  const rows = streams.map((stream) => normalizeMovie(stream, categories, sourceId));
  const admin = createSupabaseAdminClient();
  const { error } = await admin!.from("media_items").insert(rows);
  if (error) throw new Error(error.message);
  await admin!.from("import_logs").insert({
    iptv_source_id: sourceId,
    import_type: "xtream_movies",
    status: "success",
    message: "Xtream movie import completed. Items are pending review.",
    items_found: streams.length,
    items_imported: rows.length,
  });
  return { itemsFound: streams.length, itemsImported: rows.length };
}

export async function importXtreamSeries(sourceId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { itemsFound: 0, itemsImported: 0, message: "Mock Xtream series import." };
  }
  const [categories, streams] = await Promise.all([
    fetchSeriesCategories(sourceId),
    fetchSeriesStreams(sourceId),
  ]);
  const rows = streams.map((stream) => normalizeSeries(stream, categories, sourceId));
  const admin = createSupabaseAdminClient();
  const { error } = await admin!.from("media_items").insert(rows);
  if (error) throw new Error(error.message);
  await admin!.from("import_logs").insert({
    iptv_source_id: sourceId,
    import_type: "xtream_series",
    status: "success",
    message: "Xtream series import completed. Items are pending review.",
    items_found: streams.length,
    items_imported: rows.length,
  });
  return { itemsFound: streams.length, itemsImported: rows.length };
}
