// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug: log exactly what Next.js sees from your env
console.log(
  "[supabase] NEXT_PUBLIC_SUPABASE_URL =",
  JSON.stringify(rawUrl)
);
console.log(
  "[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY length =",
  anonKey ? anonKey.length : "MISSING"
);

if (!rawUrl || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabaseUrl = rawUrl.replace(/\/$/, "");

/**
 * Shared Supabase client for server components.
 */
export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Build a usable image URL from the value stored in photos.image_path.
 */
export function getMediaPublicUrl(imagePath: string): string {
  if (!imagePath) return "";

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  return `${supabaseUrl}/storage/v1/object/public/media/${imagePath}`;
}
