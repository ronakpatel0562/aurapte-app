"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";
import type { PlanId } from "@/lib/plans";

/**
 * Every action here re-checks the caller is an admin using the *session*
 * client (cookies), then does the actual write with the *service role*
 * client so it bypasses RLS and the protect_plan_columns trigger (which
 * only allows the service role to touch plan/plan_expiry — see
 * supabase/migrations/20260707_lock_plan_columns.sql). Never skip the
 * isAdminEmail check just because a service-role client is available.
 */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}

function adminClient() {
  const { url } = getSupabaseCredentials();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } });
}

export async function activatePlan(
  userId: string,
  plan: PlanId,
  months: number,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!userId || (plan !== "free" && plan !== "premium")) {
    return { error: "Invalid plan or user" };
  }
  if (!Number.isFinite(months) || months <= 0 || months > 36) {
    return { error: "Invalid duration" };
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  const admin = adminClient();
  const { error } = await admin
    .from("profiles")
    .update({ plan, plan_expiry: expiry.toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

export async function extendPlan(
  userId: string,
  months: number,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!Number.isFinite(months) || months <= 0 || months > 36) {
    return { error: "Invalid duration" };
  }

  const admin = adminClient();
  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("plan_expiry")
    .eq("id", userId)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message };

  const base =
    profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now()
      ? new Date(profile.plan_expiry)
      : new Date();
  base.setMonth(base.getMonth() + months);

  const { error } = await admin
    .from("profiles")
    .update({ plan_expiry: base.toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

export async function revokeAccess(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const admin = adminClient();
  const { error } = await admin
    .from("profiles")
    .update({ plan_expiry: null })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

export async function deleteUserAccount(userId: string): Promise<{ error?: string }> {
  let caller;
  try {
    caller = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (caller.id === userId) {
    return { error: "You can't delete your own admin account from here." };
  }

  const admin = adminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}
