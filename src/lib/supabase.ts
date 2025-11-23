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
 * Build a public URL for a file in the `media` bucket.
 * Example image_path: 'food/2025-01-10-salmon.jpg'
 */
export function getMediaPublicUrl(imagePath: string): string {
  if (!imagePath) return "";
  return `${supabaseUrl}/storage/v1/object/public/media/${imagePath}`;
}
