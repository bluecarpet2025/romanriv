import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id as number | undefined;

    if (!id) {
      return NextResponse.json(
        { error: "Missing photo id" },
        { status: 400 }
      );
    }

    // Get current views (if any)
    const { data, error } = await supabase
      .from("photos")
      .select("views")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      // Some real error (not "no rows")
      console.error("[views] select error", error);
      return NextResponse.json(
        { error: "Failed to read views" },
        { status: 500 }
      );
    }

    const currentViews = (data?.views as number | null) ?? 0;

    const { error: updateError } = await supabase
      .from("photos")
      .update({ views: currentViews + 1 })
      .eq("id", id);

    if (updateError) {
      console.error("[views] update error", updateError);
      return NextResponse.json(
        { error: "Failed to update views" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[views] unexpected error", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
