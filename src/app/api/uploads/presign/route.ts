import { requireUploadAdmin, readUploadJson, uploadErrorResponse } from "@/lib/upload-auth";
import { presignImageUpload } from "@/lib/r2";
import { UploadError, validateUploadInput } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUploadAdmin(request);
    const input = validateUploadInput(await readUploadJson(request));
    let previousCoverUrl: string | null = null;
    if (input.folder === "anime-covers") {
      const { data, error } = await supabase.from("anime").select("id, cover_url")
        .eq("id", input.animeId!).maybeSingle();
      if (error) throw new UploadError("Could not load the anime record.", 500);
      if (!data) throw new UploadError("Anime record not found.", 404);
      previousCoverUrl = data.cover_url;
    }
    const upload = await presignImageUpload(input, user.id, previousCoverUrl);
    return Response.json(upload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return uploadErrorResponse(error);
  }
}
