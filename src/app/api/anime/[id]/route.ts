import { requireUploadAdmin } from "@/lib/upload-auth";
import { UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireUploadAdmin(request);
    const { id } = await context.params;
    // Use the same anime ID policy as cover uploads; never accept a storage key.
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new UploadError("Invalid anime ID.");
    const { data: row, error: loadError } = await supabase.from("anime")
      .select("id").eq("id", id).maybeSingle();
    if (loadError) throw new UploadError("Could not load the anime. Nothing was deleted.", 500);
    if (!row) throw new UploadError("Anime not found. Refresh the list.", 404);

    // Cover objects are retained for separate orphan cleanup.
    const { data: deleted, error } = await supabase.from("anime")
      .delete().eq("id", id).select("id").maybeSingle();
    if (error) throw new UploadError("Could not delete the anime. Please retry.", 500);
    if (!deleted) throw new UploadError("Anime was not deleted. Refresh and check your access.", 409);
    return Response.json({ id: deleted.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof UploadError ? error.message : "Anime deletion failed. Please retry." }, {
      status: error instanceof UploadError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
