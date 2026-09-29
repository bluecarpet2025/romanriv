import { validateUploadInput, type UploadFolder } from "@/lib/uploads";

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload request failed.");
  return result;
}

export async function uploadAdminImage(file: File, folder: UploadFolder, animeId?: string): Promise<{ key: string; publicUrl: string }> {
  const input = validateUploadInput({ folder, animeId, fileName: file.name, contentType: file.type, size: file.size });
  const upload = await postJson("/api/uploads/presign", input);
  const response = await fetch(upload.uploadUrl, {
    method: "PUT", body: file, headers: upload.headers, credentials: "omit",
  });
  if (!response.ok) throw new Error(`R2 upload failed (HTTP ${response.status}). No database reference was saved.`);
  return postJson("/api/uploads/complete", { token: upload.token });
}
