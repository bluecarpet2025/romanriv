import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // simple "+1" increment – no floor required
    const { data, error } = await supabase
      .from("anime")
      .select("views")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[anime/view] select error", error);
      return NextResponse.json(
        { error: "Anime not found" },
        { status: 404 }
      );
    }

    const currentViews = data.views ?? 0;
    const newViews = currentViews + 1;

    const { data: updated, error: updateError } = await supabase
      .from("anime")
      .update({ views: newViews })
      .eq("id", id)
      .select("views")
      .single();

    if (updateError || !updated) {
      console.error("[anime/view] update error", updateError);
      return NextResponse.json(
        { error: "Failed to update views" },
        { status: 500 }
      );
    }

    return NextResponse.json({ views: updated.views });
  } catch (err) {
    console.error("[anime/view] unexpected error", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
