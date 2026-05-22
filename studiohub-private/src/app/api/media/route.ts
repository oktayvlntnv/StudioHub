import { NextResponse } from "next/server";
import { getMediaItems } from "@/lib/data/catalog";
import { requireOwnerSession } from "@/lib/auth/owner";

export async function GET() {
  const { response } = await requireOwnerSession();
  if (response) return response;

  const items = await getMediaItems();
  return NextResponse.json({ items });
}
