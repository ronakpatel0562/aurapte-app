import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Users, AlertTriangle } from "lucide-react";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";
import UsersTable, { type AdminUserRow } from "./UsersTable";

/**
 * /admin/users
 *
 * Owner-only dashboard for managing who has paid access. There is no free
 * tier and no payment gateway (see src/lib/plans.ts) — payment is confirmed
 * manually (bank transfer / UPI), so an admin needs a way to flip
 * profiles.plan / plan_expiry without touching the Supabase SQL editor by
 * hand. This replaces ad hoc scripts like scripts/set_test_account_plan_expiry.js.
 *
 * Gated the same way as /admin/question-links: ADMIN_EMAILS allowlist,
 * checked both here (page-level redirect) and in every server action in
 * ./actions.ts (defense-in-depth — the action is the real boundary).
 */
export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/users");
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

  // auth.admin.listUsers is paginated (default 50/page). Walk pages until
  // exhausted — fine for an admin tool used by one person, not a hot path.
  const authUsers: Array<{ id: string; email: string | null; created_at: string }> = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    authUsers.push(
      ...data.users.map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at })),
    );
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break; // 10k users hard cap, sanity guard
  }

  const ids = authUsers.map((u) => u.id);
  const profilesById = new Map<string, { plan: string | null; plan_expiry: string | null; full_name: string | null }>();
  const CHUNK = 500;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, plan, plan_expiry, full_name")
      .in("id", chunk);
    for (const p of profiles ?? []) {
      profilesById.set(p.id, { plan: p.plan, plan_expiry: p.plan_expiry, full_name: p.full_name });
    }
  }

  const rows: AdminUserRow[] = authUsers
    .map((u) => {
      const profile = profilesById.get(u.id);
      return {
        id: u.id,
        email: u.email,
        fullName: profile?.full_name ?? null,
        createdAt: u.created_at,
        plan: (profile?.plan as "free" | "premium" | null) ?? "free",
        planExpiry: profile?.plan_expiry ?? null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeCount = rows.filter(
    (r) => r.planExpiry && new Date(r.planExpiry).getTime() > Date.now(),
  ).length;

  return (
    <div className="space-y-6 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/admin" className="hover:text-ink transition">Admin</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Users</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-ink" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            User &amp; access management
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-2xl">
            {rows.length} signed-up user{rows.length === 1 ? "" : "s"}, {activeCount} with active
            paid access. There is no free tier — everyone else is paywalled until you activate a
            plan below (after confirming their bank transfer / UPI payment).
          </p>
        </div>
      </div>

      <UsersTable initialRows={rows} />
    </div>
  );
}
