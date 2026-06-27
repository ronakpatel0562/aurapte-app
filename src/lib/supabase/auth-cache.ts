import "server-only";
import { cache } from "react";
import { createClient } from "./server";

/**
 * Per-request memoised wrapper around `supabase.auth.getUser()`.
 *
 * Why this matters: Next.js server components on the same page each
 * create their own Supabase client and call `auth.getUser()` themselves.
 * Without caching, a page that has 3 server components runs 3 round-trips
 * to the Supabase auth server. With `React.cache`, all three see the
 * same memoised Promise for the duration of the request.
 *
 * Resilience strategy:
 *   1. Try `getUser()` first — it's the canonical check.
 *   2. If that fails (network blip, expired JWT, transient 5xx), try
 *      `getSession()` which uses the refresh token automatically.
 *   3. If both fail, return `null` and let the caller decide.
 *
 * Without this, a transient Supabase hiccup could bounce the user to
 * /login mid-navigation. With this, only a hard invalidation kicks them
 * out — which is the correct behaviour.
 *
 * `cache()` only dedupes inside a single render pass — it does not
 * persist across requests, so there's no cross-user leak risk.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return data.user;

    // Primary failed — try the session API. getSession() reads the
    // session from cookies (or storage) and uses the refresh token
    // automatically when the access token is expired.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user;

    if (error) {
      console.warn("[auth-cache] getUser error:", error.message);
    }
    return null;
  } catch (err) {
    console.warn(
      "[auth-cache] getUser threw:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
});