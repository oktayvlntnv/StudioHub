export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  tmdbApiKey: process.env.TMDB_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  privateAppMode: process.env.PRIVATE_APP_MODE !== "false",
  encryptionSecret: process.env.ENCRYPTION_SECRET,
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey,
  );
}

export function isTmdbConfigured() {
  return Boolean(env.tmdbApiKey);
}

export function assertServerSecret(name: "ENCRYPTION_SECRET" | "TMDB_API_KEY") {
  const value =
    name === "ENCRYPTION_SECRET" ? env.encryptionSecret : env.tmdbApiKey;
  if (!value) {
    throw new Error(`${name} is required for this server operation.`);
  }
  return value;
}
