import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CounterAction, MediaKind } from "./media-counters";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RPC = {
  photo: { view: "increment_photo_view", like: "increment_photo_likes" },
  anime: { view: "increment_anime_views", like: "increment_anime_likes" },
};

export function createMediaCounterHandler(kind: MediaKind, action: CounterAction) {
  return async function POST(req: Request) {
    const field = action === "view" ? "views" : "likes";
    const label = kind === "photo" ? "Photo" : "Anime";
    try {
      const body: unknown = await req.json().catch(() => null);
      const id = body && typeof body === "object" && "id" in body ? body.id : null;
      const delta = body && typeof body === "object" && "delta" in body ? body.delta : null;
      if (typeof id !== "string" || !uuid.test(id) || (action === "like" && delta !== 1 && delta !== -1)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
      const args = { [kind === "photo" ? "photo_id" : "anime_id"]: id, ...(action === "like" ? { delta } : {}) };
      const { data, error } = await supabase.rpc(RPC[kind][action], args);
      if (error) {
        console.error(`[${kind}/${action}] RPC error`, error);
        return NextResponse.json({ error: `Failed to update ${field}` }, { status: 500 });
      }
      if (data === null) return NextResponse.json({ error: `${label} not found` }, { status: 404 });
      if (!Number.isInteger(data) || data < 0) return NextResponse.json({ error: `Failed to update ${field}` }, { status: 500 });
      return NextResponse.json({ ...(kind === "photo" && action === "view" ? { ok: true } : {}), [field]: data });
    } catch (error) {
      console.error(`[${kind}/${action}] unexpected error`, error);
      return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
  };
}
