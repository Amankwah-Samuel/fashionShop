import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const SUPABASE_NOT_CONFIGURED =
  "Supabase isn't connected yet. Add your Supabase URL and keys to .env.local, then restart pnpm dev.";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Server-only Supabase client using the service-role key. It bypasses Row
 * Level Security, so it must never be imported into a Client Component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill it in.",
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
