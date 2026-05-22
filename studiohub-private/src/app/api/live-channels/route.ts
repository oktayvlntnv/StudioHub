import { NextResponse } from "next/server";
import { getLiveChannels } from "@/lib/data/catalog";
import { requireOwnerSession } from "@/lib/auth/owner";

export async function GET() {
  const { response } = await requireOwnerSession();
  if (response) return response;

  const channels = await getLiveChannels();
  return NextResponse.json({ channels });
}
