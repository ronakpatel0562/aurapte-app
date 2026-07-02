import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionId } from "@/lib/session";

/**
 * Heartbeat endpoint. The client hits this once a minute while a tab is
 * visible (see `useHeartbeat`). It does the only DB-touching session
 * validation in the app — that work used to happen on every navigation
 * via the middleware, which is what made every click feel like 5s on a
 * slow network. Now it happens on a single, predictable schedule.
 *
 * Returns `{ ok: true }` on success. On any failure, the client should
 * stop sending heartbeats and the user will be bounced on the next
 * protected navigation when the middleware's local HMAC check passes but
 * no cookie / wrong cookie exists.
 */
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieValue = parseCookie(cookieHeader, "session_id");
    const secret = process.env.SESSION_SECRET || "fallback-secret-key-12345";
    const cleanSessionId = cookieValue
      ? await verifySessionId(cookieValue, secret)
      : null;
    if (!cleanSessionId) {
      return NextResponse.json(
        { ok: false, reason: "invalid_cookie" },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, reason: "no_user" },
        { status: 401 }
      );
    }

    const { data: sessionData, error } = await supabase
      .from("user_sessions")
      .select("session_id, last_heartbeat")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "db_error", detail: error.message },
        { status: 500 }
      );
    }

    if (!sessionData || sessionData.session_id !== cleanSessionId) {
      // `error: "SESSION_OVERWRITTEN"` (exact key/casing) is what
      // SessionGuard's fetch interceptor matches on to force-logout and
      // redirect this device to /login — a newer login has replaced this
      // session's row in `user_sessions`.
      return NextResponse.json(
        { ok: false, error: "SESSION_OVERWRITTEN" },
        { status: 401 }
      );
    }

    // Throttle the heartbeat write so we don't hammer the DB — only
    // update last_heartbeat when it's older than 60 seconds.
    const last = new Date(sessionData.last_heartbeat).getTime();
    if (Date.now() - last > 60_000) {
      // Fire-and-forget: don't make the client wait on this write.
      void supabase
        .from("user_sessions")
        .update({ last_heartbeat: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("session_id", cleanSessionId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: "unexpected", detail: String(err) },
      { status: 500 }
    );
  }
}

function parseCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}