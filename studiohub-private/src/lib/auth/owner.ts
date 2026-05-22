import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface OwnerSession {
  userId: string;
  email: string | null;
  role: "owner" | "admin";
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  if (!isSupabaseConfigured()) {
    return {
      userId: "mock-owner",
      email: "owner@example.com",
      role: "owner",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["owner", "admin"].includes(profile.role)) return null;

  return {
    userId: profile.id,
    email: profile.email ?? user.email ?? null,
    role: profile.role,
  };
}

export async function requireOwnerSession() {
  const session = await getOwnerSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null };
}
