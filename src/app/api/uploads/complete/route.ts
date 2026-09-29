import { requireUploadAdmin, readUploadJson, uploadErrorResponse } from "@/lib/upload-auth";
import { readUploadTicket, verifyUploadedImage } from "@/lib/r2";
import { UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUploadAdmin(request);
    const body = await readUploadJson(request);
    const token = body && typeof body === "object" && "token" in body ? body.token : undefined;
    const ticket = readUploadTicket(token, user.id);
    const publicUrl = await verifyUploadedImage(ticket);

    if (ticket.input.folder === "anime-covers") {
      // Compare-and-swap protects a newer cover saved from another tab.
      const { data: current, error: readError } = await supabase.from("anime").select("id, cover_url")
        .eq("id", ticket.input.animeId!).maybeSingle();
      if (readError) throw new UploadError("Could not load the anime record.", 500);
      if (!current) throw new UploadError("Anime record not found.", 404);
      if (current.cover_url !== publicUrl) {
        let update = supabase.from("anime").update({ cover_url: publicUrl }).eq("id", ticket.input.animeId!);
        update = ticket.previousCoverUrl === null
          ? update.is("cover_url", null)
          : update.eq("cover_url", ticket.previousCoverUrl);
        const { data, error } = await update.select("id").maybeSingle();
        if (error) throw new UploadError("Image uploaded, but the cover could not be saved. The previous cover was retained.", 500);
        if (!data) throw new UploadError("The cover changed while uploading. Reload before replacing it again.", 409);
      }
    } else {
      // A repeated completion request should not normally insert the photo twice.
      const { data: existing, error: readError } = await supabase.from("photos").select("id")
        .eq("image_path", ticket.key).maybeSingle();
      if (readError) throw new UploadError("Could not check the photo record.", 500);
      if (!existing) {
        const { data, error } = await supabase.from("photos").insert({
          category: ticket.input.folder,
          title: ticket.input.fileName.replace(/\.[^/.]+$/, ""),
          description: "",
          image_path: ticket.key,
          tags: [],
        }).select("id").single();
        if (error || !data) throw new UploadError("Image uploaded, but the photo record could not be saved.", 500);
      }
    }
    // Keep old covers and unreferenced uploads for recovery; never delete here.
    return Response.json({ key: ticket.key, publicUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return uploadErrorResponse(error);
  }
}
