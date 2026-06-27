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

      // Check if an active session exists on another device
      const { data: existingSession } = await supabase
        .from("user_sessions")
        .select("last_heartbeat")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingSession) {
        const lastHeartbeat = new Date(existingSession.last_heartbeat).getTime();
        const now = Date.now();
        const differenceInMinutes = (now - lastHeartbeat) / (1000 * 60);

        if (differenceInMinutes < 5) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=SESSION_ACTIVE`);
        }
      }

      // Single active session enforcement: Generate and UPSERT session_id
      const sessionId = crypto.randomUUID();

      await supabase.from("user_sessions").upsert(
        {
          user_id: user.id,
          session_id: sessionId,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

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
