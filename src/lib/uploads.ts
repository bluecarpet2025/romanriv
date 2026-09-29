// Shared upload policy. This module contains no credentials or server SDKs.
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const;
export const IMAGE_ACCEPT = Object.keys(IMAGE_EXTENSIONS).join(",");
export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;
export type UploadFolder = "food" | "car" | "anime-covers";
export type UploadInput = {
  folder: UploadFolder;
  fileName: string;
  contentType: ImageContentType;
  size: number;
  animeId?: string;
};

export class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function validateUploadInput(value: unknown): UploadInput {
  if (!value || typeof value !== "object") throw new UploadError("Invalid upload request.");
  const input = value as Record<string, unknown>;
  if (!["food", "car", "anime-covers"].includes(String(input.folder))) {
    throw new UploadError("Uploads are limited to food, car, and anime-covers.");
  }
  if (typeof input.fileName !== "string" || !input.fileName.trim() || input.fileName.length > 255) {
    throw new UploadError("A filename of at most 255 characters is required.");
  }
  if (typeof input.contentType !== "string" || !Object.hasOwn(IMAGE_EXTENSIONS, input.contentType)) {
    throw new UploadError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
  }
  if (typeof input.size !== "number" || !Number.isSafeInteger(input.size) || input.size <= 0 || input.size > MAX_IMAGE_BYTES) {
    throw new UploadError("Images must be nonempty and no larger than 20 MiB.");
  }
  if (input.folder === "anime-covers" &&
      (typeof input.animeId !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(input.animeId))) {
    throw new UploadError("Select an anime before uploading a cover.");
  }
  return {
    folder: input.folder as UploadFolder,
    fileName: input.fileName,
    contentType: input.contentType as ImageContentType,
    size: input.size,
    ...(input.folder === "anime-covers" ? { animeId: input.animeId as string } : {}),
  };
}
