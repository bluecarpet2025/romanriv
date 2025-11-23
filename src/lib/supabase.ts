// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabaseUrl = rawUrl.replace(/\/$/, "");

/**
 * Shared Supabase client for server components.
 * We don't persist sessions since we're only doing public, read-only queries.
 */
export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Build a usable image URL from the value stored in photos.image_path.
 *
 * Supports:
 * - Full URLs: "https://..." -> returned as-is
 * - Local public files: "/placeholder-food-1.jpg" -> returned as-is
 * - Storage paths: "food/2025-01-10-salmon.jpg" -> mapped to media bucket
 */
export function getMediaPublicUrl(imagePath: string): string {
  if (!imagePath) return "";

  // Already a full URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Local file in /public (e.g. "/placeholder-food-1.jpg")
  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  // Default: treat as path inside the "media" storage bucket
  return `${supabaseUrl}/storage/v1/object/public/media/${imagePath}`;
}
