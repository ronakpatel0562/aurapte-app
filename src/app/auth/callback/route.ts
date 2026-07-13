import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { signSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // Single active session enforcement: always overwrite `user_sessions`
      // below rather than blocking this login — any device holding the old
      // session_id gets logged out the next time its heartbeat notices the
      // mismatch (see SessionGuard/useHeartbeat).
      const sessionId = crypto.randomUUID();

      await supabase.from("user_sessions").upsert(
        {
          user_id: user.id,
          session_id: sessionId,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip =
        (forwardedFor ? forwardedFor.split(",")[0].trim() : request.headers.get("x-real-ip")) ||
        null;
      await supabase.from("session_history").insert({
        user_id: user.id,
        session_id: sessionId,
        ip_address: ip,
        user_agent: request.headers.get("user-agent"),
      });

      // Sign the session ID and set the signed httpOnly cookie
      const secret = process.env.SESSION_SECRET || "fallback-secret-key-12345";
      const signedSessionId = await signSessionId(sessionId, secret);

      response.cookies.set("session_id", signedSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }
  }

  // Return to login on failure
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
