"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";
import type { PlanId } from "@/lib/plans";

/**
 * Same pattern as admin/users/actions.ts: re-check the caller is an admin
 * with the session client, then do the write with the service-role client
 * so it bypasses RLS and the protect_plan_columns trigger.
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

export async function approveClaim(claimId: string): Promise<{ error?: string }> {
  let caller;
  try {
    caller = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const admin = adminClient();
  const { data: claim, error: fetchErr } = await admin
    .from("payment_claims")
    .select("id, user_id, plan_id, months, status")
    .eq("id", claimId)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message };
  if (!claim) return { error: "Claim not found" };
  if (claim.status !== "pending") return { error: "Claim already reviewed" };

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_expiry")
    .eq("id", claim.user_id)
    .maybeSingle();
  const base =
    profile?.plan_expiry && new Date(profile.plan_expiry).getTime() > Date.now()
      ? new Date(profile.plan_expiry)
      : new Date();
  base.setMonth(base.getMonth() + claim.months);

  const { error: planErr } = await admin
    .from("profiles")
    .update({ plan: claim.plan_id as PlanId, plan_expiry: base.toISOString() })
    .eq("id", claim.user_id);
  if (planErr) return { error: planErr.message };

  const { error: claimErr } = await admin
    .from("payment_claims")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: caller.id })
    .eq("id", claimId);
  if (claimErr) return { error: claimErr.message };

  revalidatePath("/admin/payments");
  revalidatePath("/admin/users");
  return {};
}

export async function rejectClaim(claimId: string, note?: string): Promise<{ error?: string }> {
  let caller;
  try {
    caller = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const admin = adminClient();
  const { error } = await admin
    .from("payment_claims")
    .update({
      status: "rejected",
      admin_note: note ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: caller.id,
    })
    .eq("id", claimId)
    .eq("status", "pending");
  if (error) return { error: error.message };

  revalidatePath("/admin/payments");
  return {};
}

export async function getScreenshotUrl(path: string): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const admin = adminClient();
  const { data, error } = await admin.storage.from("payment-proofs").createSignedUrl(path, 3600);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
