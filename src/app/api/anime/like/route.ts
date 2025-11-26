import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, delta } = await req.json();

    if (!id || (delta !== 1 && delta !== -1)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // 1) Get current likes
    const { data, error } = await supabase
      .from("anime_titles")
      .select("likes")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[anime/like] select error", error);
      return NextResponse.json(
        { error: "Anime not found" },
        { status: 404 }
      );
    }

    const currentLikes = data.likes ?? 0;
    const newLikes = Math.max(0, currentLikes + delta);

    // 2) Update likes
    const { data: updated, error: updateError } = await supabase
      .from("anime_titles")
      .update({ likes: newLikes })
      .eq("id", id)
      .select("likes")
      .single();

    if (updateError || !updated) {
      console.error("[anime/like] update error", updateError);
      return NextResponse.json(
        { error: "Failed to update likes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ likes: updated.likes });
  } catch (err) {
    console.error("[anime/like] unexpected error", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
