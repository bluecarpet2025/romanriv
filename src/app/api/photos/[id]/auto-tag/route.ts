import { requireUploadAdmin, readUploadJson } from "@/lib/upload-auth";
import { UploadError } from "@/lib/uploads";
import { analyzeFoodImage, FoodTaggingError, foodImageUrl } from "@/lib/food-tagging";
import { hasFoodTags, parseIngredientTags, postgresTagArray } from "@/lib/food-tags";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireUploadAdmin(request);
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new UploadError("Invalid photo ID.");
    const body = await readUploadJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) || ("force" in body && typeof body.force !== "boolean")) throw new UploadError("Expected an object with an optional boolean force flag.");
    const force = "force" in body && body.force === true;
    const { data: photo, error } = await supabase.from("photos").select("id, category, image_path, tags").eq("id", id).maybeSingle();
    if (error) throw new UploadError("Could not load this photo.", 500);
    if (!photo) throw new UploadError("Photo not found.", 404);
    if (photo.category !== "food") throw new UploadError("Automatic ingredient tagging is only available for food photos.", 422);
    if (hasFoodTags(photo.tags) && !force) return Response.json({ id, tags: photo.tags, skipped: true }, { headers: { "Cache-Control": "no-store" } });

    const tags = parseIngredientTags(await analyzeFoodImage(foodImageUrl(photo.image_path), request.signal));
    if (request.signal.aborted) throw new FoodTaggingError("Tagging was stopped. Existing tags were retained.", 499, "tagging_cancelled");
    let update = supabase.from("photos").update({ tags }).eq("id", id).eq("category", "food").eq("image_path", photo.image_path);
    update = photo.tags === null ? update.is("tags", null) : update.eq("tags", postgresTagArray(photo.tags));
    const { data: saved, error: saveError } = await update.select("id, tags").maybeSingle();
    if (saveError) throw new UploadError("Ingredients were identified, but the tags could not be saved. Existing tags were retained.", 500);
    if (!saved) throw new UploadError("This photo changed during analysis. Its current tags were retained. Refresh before trying again.", 409);
    return Response.json({ id: saved.id, tags: saved.tags, skipped: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const known = error instanceof UploadError || error instanceof FoodTaggingError;
    return Response.json({ error: known ? error.message : "Food tagging failed. Existing tags were retained.",
      code: error instanceof FoodTaggingError ? error.code : "tagging_failed" },
    { status: known ? error.status : 500, headers: { "Cache-Control": "no-store" } });
  }
}
