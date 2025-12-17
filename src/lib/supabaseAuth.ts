// src/lib/supabaseAuth.ts
import { createBrowserClient, createServerClient } from "@supabase/ssr";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabaseUrl = rawUrl.replace(/\/$/, "");
const supabaseAnonKey = anonKey;

/**
 * Browser client (use in client components like /login)
 */
export function createSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server client (use in Server Components / Route Handlers)
 * IMPORTANT: this function must only be called on the server.
 */
export async function createSupabaseServer() {
  // Dynamic import so this file can be imported by client bundles safely.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op (some server contexts make cookies read-only)
        }
      },
    },
  });
}
