"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isPublicSupabaseConfigured, publicEnv } from "@/lib/public-env";

export function createSupabaseBrowserClient() {
  if (!isPublicSupabaseConfigured()) return null;
  return createBrowserClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!);
}
