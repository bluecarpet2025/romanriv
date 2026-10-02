import { requireUploadAdmin } from "@/lib/upload-auth";
import { deletePhotoObject } from "@/lib/r2";
import { UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireUploadAdmin(request);
    const { id } = await context.params;
    // Existing photo consumers support numeric IDs; UUIDs are also valid.
    if (!/^(?:[1-9][0-9]{0,18}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id)) {
      throw new UploadError("Invalid photo ID.");
    }
    const { data: photo, error: loadError } = await supabase.from("photos")
      .select("id, image_path").eq("id", id).maybeSingle();
    if (loadError) throw new UploadError("Could not load the photo. Nothing was deleted.", 500);
    if (!photo) throw new UploadError("Photo not found. Refresh the list.", 404);
    // The browser cannot select an R2 key: it comes from the loaded row.
    await deletePhotoObject(photo.image_path);
    const { data: deleted, error: deleteError } = await supabase.from("photos")
      .delete().eq("id", id).eq("image_path", photo.image_path).select("id").maybeSingle();
    if (deleteError) throw new UploadError("The R2 image was removed, but the photo record could not be deleted. Retry Delete to finish cleanup.", 500);
    if (!deleted) throw new UploadError("The R2 image was removed, but the row was not deleted. Refresh and retry; the row may have changed or deletion may be blocked.", 409);
    return Response.json({ id: deleted.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof UploadError ? error.message : "Photo deletion failed. Please retry." }, {
      status: error instanceof UploadError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
