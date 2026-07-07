import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Receipt, AlertTriangle } from "lucide-react";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";
import PaymentClaimsTable, { type AdminClaimRow } from "./PaymentClaimsTable";

/**
 * /admin/payments — review queue for the in-app "I've made the payment"
 * submissions from BankPaymentPanel (src/components/billing/BankPaymentPanel.tsx).
 * Replaces the old flow where a user had to open their mail app; now they
 * submit a reference + screenshot in-app and an admin approves/rejects here,
 * which flips profiles.plan the same way /admin/users does.
 */
export default async function AdminPaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/payments");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return (
      <div className="space-y-6 py-2 sm:py-4">
        <div className="flex items-start gap-2 p-4 bg-warning-soft/50 border border-warning/20 rounded-lg max-w-xl">
          <AlertTriangle className="w-4 h-4 text-warning-deep shrink-0 mt-0.5" />
          <div className="text-sm text-warning-deep leading-relaxed">
            <strong>Service role key not set.</strong> Add{" "}
            <code className="font-mono text-2xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
            <code className="font-mono text-2xs">.env.local</code> to use this page.
          </div>
        </div>
      </div>
    );
  }

  const { url } = getSupabaseCredentials();
  const admin = createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } });

  const { data: claims } = await admin
    .from("payment_claims")
    .select("id, user_id, plan_id, months, reference, screenshot_path, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((claims ?? []).map((c) => c.user_id)));
  const emailById = new Map<string, string | null>();
  for (const id of userIds) {
    const { data } = await admin.auth.admin.getUserById(id);
    emailById.set(id, data.user?.email ?? null);
  }

  const rows: AdminClaimRow[] = (claims ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    email: emailById.get(c.user_id) ?? null,
    planId: c.plan_id as "free" | "premium",
    months: c.months,
    reference: c.reference,
    screenshotPath: c.screenshot_path,
    status: c.status as "pending" | "approved" | "rejected",
    createdAt: c.created_at,
  }));

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/admin" className="hover:text-ink transition">Admin</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Payments</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-ink" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            Payment claims
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-2xl">
            {pendingCount} pending claim{pendingCount === 1 ? "" : "s"} submitted in-app after bank
            transfer / UPI. Approve to activate the plan immediately, or reject with a note.
          </p>
        </div>
      </div>

      <PaymentClaimsTable initialRows={rows} />
    </div>
  );
}
