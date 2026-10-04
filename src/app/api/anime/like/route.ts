import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const id = body && typeof body === "object" && "id" in body ? body.id : null;
    const delta = body && typeof body === "object" && "delta" in body ? body.delta : null;
    if (typeof id !== "string" || !uuid.test(id) || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("increment_anime_likes", { anime_id: id, delta });
    if (error) {
      console.error("[anime/like] RPC error", error);
      return NextResponse.json({ error: "Failed to update likes" }, { status: 500 });
    }
    if (data === null) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }
    if (!Number.isInteger(data) || data < 0) {
      return NextResponse.json({ error: "Failed to update likes" }, { status: 500 });
    }
    return NextResponse.json({ likes: data });
  } catch (err) {
    console.error("[anime/like] unexpected error", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
