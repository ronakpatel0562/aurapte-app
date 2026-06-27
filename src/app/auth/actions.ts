"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signSessionId } from "@/lib/session";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createClient();

  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { error: "Authentication failed. User not found." };
  }

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
      return {
        error: "A login session is already active on another device. Please log out from that device first.",
      };
    }
  }

  // 2. Generate new session_id (UUID)
  const sessionId = crypto.randomUUID();

  // 3. UPSERT into user_sessions
  const { error: sessionError } = await supabase
    .from("user_sessions")
    .upsert(
      {
        user_id: user.id,
        session_id: sessionId,
        last_heartbeat: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (sessionError) {
    console.error("Session creation error:", sessionError);
    return { error: "Failed to establish secure session." };
  }

  // 4. Set signed session_id in a signed httpOnly cookie
  const secret = process.env.SESSION_SECRET || "fallback-secret-key-12345";
  const signedSessionId = await signSessionId(sessionId, secret);

  cookies().set("session_id", signedSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Redirect to dashboard
  redirect("/dashboard");
}

export async function signup(prevState: any, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const phone = formData.get("phone") as string;

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = createClient();

  // 1. Sign up user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || "",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const session = data.session;
  const user = data.user;

  // If auto-logged in (email confirmation disabled in Supabase)
  if (session && user) {
    // Generate session_id
    const sessionId = crypto.randomUUID();

    // UPSERT session
    const { error: sessionError } = await supabase.from("user_sessions").upsert(
      {
        user_id: user.id,
        session_id: sessionId,
        last_heartbeat: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (sessionError) {
      return { error: "Registration succeeded but session initialization failed. Please login." };
    }

    const secret = process.env.SESSION_SECRET || "fallback-secret-key-12345";
    const signedSessionId = await signSessionId(sessionId, secret);

    cookies().set("session_id", signedSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect("/dashboard");
  }

  // If verification is needed
  return { success: true, message: "Check your email to verify your account." };
}

export async function logout() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Delete session from database
    await supabase.from("user_sessions").delete().eq("user_id", user.id);
  }

  // Sign out from auth
  await supabase.auth.signOut();

  // Clear cookie
  cookies().delete("session_id");

  redirect("/login");
}
