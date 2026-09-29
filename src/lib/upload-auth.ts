import "server-only";
import { createSupabaseServer } from "@/lib/supabaseAuth";
import { UploadError } from "@/lib/uploads";

export async function requireUploadAdmin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new UploadError("Cross-origin upload requests are not allowed.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new UploadError("Expected a JSON request.", 415);
  }
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new UploadError("Please sign in again.", 401);

  const { data: admin, error } = await supabase
    .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !admin) throw new UploadError("Admin access is required.", 403);
  return { supabase, user };
}

export async function readUploadJson(request: Request): Promise<unknown> {
  try {
    const body = await request.text();
    if (body.length > 8192) throw new UploadError("Upload request is too large.", 413);
    return JSON.parse(body);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("Invalid JSON request.");
  }
}

export function uploadErrorResponse(error: unknown) {
  // Never return SDK errors, credentials, or signed URLs in an error response.
  const known = error instanceof UploadError;
  return Response.json(
    { error: known ? error.message : "Upload service unavailable. Please try again." },
    { status: known ? error.status : 500, headers: { "Cache-Control": "no-store" } },
  );
}
