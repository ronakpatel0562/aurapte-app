import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseCredentials } from "./config";

export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseCredentials();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware handles cookie refreshing.
          }
        },
      },
      global: {
        // Next.js patches global fetch() to force-cache by default, and
        // that cache is keyed on URL+method only (not on the Authorization
        // header), so every PostgREST GET here — dashboard stats, recent
        // activity, test progress — was served from a stale Data Cache
        // entry from the first request after a server restart, no matter
        // how fresh the underlying row was. no-store makes every Supabase
        // request bypass that cache.
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}

