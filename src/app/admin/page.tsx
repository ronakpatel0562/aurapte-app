import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ShieldCheck, Users, Receipt, Link2, MonitorSmartphone } from "lucide-react";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";

/**
 * /admin — landing hub for the owner-only tools scattered across
 * /admin/users, /admin/payments, /admin/question-links. None of these are
 * linked from the app's sidebar (they're not meant to be discoverable by
 * regular users), so this page is the one bookmark-worthy URL that fans out
 * to the rest instead of having to remember each path.
 */
export default async function AdminHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  let pendingPayments = 0;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const { url } = getSupabaseCredentials();
    const admin = createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } });
    const { count } = await admin
      .from("payment_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingPayments = count ?? 0;
  }

  const tools = [
    {
      href: "/admin/payments",
      icon: Receipt,
      title: "Payment claims",
      description: "Review in-app payment submissions and activate plans.",
      badge: pendingPayments > 0 ? `${pendingPayments} pending` : null,
    },
    {
      href: "/admin/users",
      icon: Users,
      title: "Users & access",
      description: "Search users, activate/extend/revoke plans by hand.",
      badge: null,
    },
    {
      href: "/admin/question-links",
      icon: Link2,
      title: "Question links",
      description: "Map Mongo IDs to Supabase question UUIDs.",
      badge: null,
    },
    {
      href: "/admin/sessions",
      icon: MonitorSmartphone,
      title: "Device & session log",
      description: "See every device an account has logged in from; flags likely credential sharing.",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Admin</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-ink" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            Admin
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-2xl">
            Owner-only tools. Not linked from the app nav — bookmark this page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="card-hover group flex flex-col gap-3 bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card hover:border-ink/20 transition"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center">
                <tool.icon className="w-4.5 h-4.5 text-ink" />
              </div>
              {tool.badge && (
                <span className="text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-warning-soft/50 text-warning-deep border border-warning/20">
                  {tool.badge}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink group-hover:underline">{tool.title}</h2>
              <p className="text-xs text-mute leading-relaxed mt-1">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
