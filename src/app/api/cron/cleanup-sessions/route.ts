import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseCredentials } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  // Verify Cron authorization secret. Fail closed: if CRON_SECRET isn't
  // configured, refuse rather than leaving this endpoint open to anyone.
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, serviceRoleKey } = getSupabaseCredentials();
    // Use Supabase Service Role client to delete records across any user (bypassing RLS)
    const supabase = createClient(url, serviceRoleKey);


    // Cutoff time is 24 hours ago. Tuned for the daily cron schedule in
    // vercel.json — sessions that haven't pinged the heartbeat in 24 hours
    // belong to users who closed their browser and never came back. The
    // 5-minute active-session check in auth/callback catches the
    // "logged in from another device" case before this runs.
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("user_sessions")
      .delete()
      .lt("last_heartbeat", cutoffTime);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Inactive sessions cleaned up successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
