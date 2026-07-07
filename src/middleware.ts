import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifySessionId } from "@/lib/session";

/**
 * Middleware runs on every navigation to the protected routes below.
 *
 * IMPORTANT: this file must live at src/middleware.ts, not at the project
 * root — this app uses a src/ directory (src/app), and Next.js only
 * discovers middleware.ts alongside app/pages inside src/ in that layout.
 * A root-level middleware.ts is silently ignored (empty
 * .next/server/middleware-manifest.json, no compile step, no errors) —
 * that's exactly what happened here: the hard paywall below never ran for
 * anyone, so every signup kept full Starter-tier access with no payment.
 *
 * What it does (and doesn't do):
 *   1. Refreshes the Supabase auth session so server components see a
 *      logged-in user. (1 round-trip to Supabase auth — unavoidable.)
 *   2. Verifies the `session_id` cookie's HMAC signature locally (CPU only,
 *      no DB) so we know the cookie was issued by us and hasn't been
 *      tampered with.
 *   3. Enforces the hard paywall: there is no free tier, so any
 *      authenticated user without an active (non-expired) plan is bounced
 *      to /billing before they can reach app content.
 *   4. Adds a short-lived cache hint so the browser can short-circuit
 *      repeat navigations within a few seconds (a real win on flaky links).
 *
 * What it explicitly does NOT do:
 *   - Query the `user_sessions` table on every navigation. That used to
 *     happen here and was the dominant cause of the 5-second click
 *     latency. We now do that check inside the heartbeat API instead,
 *     which fires once a minute rather than on every click.
 */
export async function middleware(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request);
  const url = new URL(request.url);

  const isBillingRoute = url.pathname === "/billing";
  const isProtectedRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/questions") ||
    url.pathname.startsWith("/practice-tests") ||
    url.pathname.startsWith("/mock-tests") ||
    url.pathname.startsWith("/specialised-tips") ||
    url.pathname.startsWith("/prediction-files") ||
    isBillingRoute;

  if (!isProtectedRoute) {
    return response;
  }

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Hard paywall: no free tier, so an active, non-expired plan is required
  // for every protected route except /billing itself.
  if (!isBillingRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_expiry")
      .eq("id", user.id)
      .maybeSingle();

    const hasActivePlan =
      !!profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now();

    if (!hasActivePlan) {
      const redirectUrl = new URL("/billing", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Cookie-signature check (HMAC, local CPU only). This proves the cookie
  // was minted by the server. It does NOT prove the row in `user_sessions`
  // is still the active session — that's checked separately by the
  // heartbeat endpoint.
  const cookieValue = request.cookies.get("session_id")?.value;
  const secret = process.env.SESSION_SECRET || "fallback-secret-key-12345";

  let cleanSessionId: string | null = null;
  if (cookieValue) {
    cleanSessionId = await verifySessionId(cookieValue, secret);
  }

  if (!cleanSessionId) {
    // Either no cookie or signature mismatch. Treat as unauthenticated.
    const isApiRequest =
      url.pathname.startsWith("/api") ||
      request.headers.get("accept")?.includes("application/json");
    if (isApiRequest) {
      return new NextResponse(
        JSON.stringify({ error: "SESSION_INVALID" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "SESSION_INVALID");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.delete("session_id");
    return redirectResponse;
  }

  // Allow the browser to reuse the page for a few seconds if the user
  // clicks back/forward rapidly. Same response for HEAD/GET only.
  if (request.method === "GET") {
    response.headers.set(
      "Cache-Control",
      "private, max-age=5, stale-while-revalidate=15"
    );
  }

  // Forward the validated session id to the page so server components can
  // skip the second Supabase auth round-trip (`auth.getUser()` is the
  // single biggest contributor to the 5-second click freeze). The page
  // reads this header to know who the user is without re-validating the
  // JWT. The HMAC check above already proved the cookie was issued by us.
  response.headers.set("x-aurapte-session", cleanSessionId);

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questions/:path*",
    "/practice-tests/:path*",
    "/mock-tests/:path*",
    "/specialised-tips/:path*",
    "/prediction-files/:path*",
    "/billing",
    "/api/heartbeat",
  ],
};
