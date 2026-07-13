import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, MonitorSmartphone } from "lucide-react";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseCredentials } from "@/lib/supabase/config";
import SessionsTable, { type AdminSessionRow, type AdminDevice } from "./SessionsTable";

/**
 * /admin/sessions
 *
 * Shows every device/IP an account has ever logged in from (session_history
 * — an append-only log, unlike user_sessions which only tracks the single
 * currently-active session). Lets an admin spot credential sharing: an
 * account with several distinct devices active around the same time is a
 * strong signal that more than one person is using it.
 */
const CONCURRENT_WINDOW_MS = 10 * 60 * 1000; // devices both seen within 10 min of each other = "concurrent"
const HISTORY_LIMIT = 5000;

export default async function AdminSessionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/sessions");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return (
      <div className="space-y-6 py-2 sm:py-4">
        <div className="text-sm text-mute">
          Set <code className="font-mono text-2xs">SUPABASE_SERVICE_ROLE_KEY</code> to use this page.
        </div>
      </div>
    );
  }

  const { url } = getSupabaseCredentials();
  const admin = createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } });

  const authUsers: Array<{ id: string; email: string | null }> = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    authUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null })));
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  const emailById = new Map(authUsers.map((u) => [u.id, u.email]));

  const { data: history } = await admin
    .from("session_history")
    .select("user_id, session_id, ip_address, user_agent, created_at, last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const byUser = new Map<string, AdminDevice[]>();
  for (const row of history ?? []) {
    const list = byUser.get(row.user_id) ?? [];
    list.push({
      sessionId: row.session_id,
      ip: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
    });
    byUser.set(row.user_id, list);
  }

  function fingerprint(d: AdminDevice): string {
    return `${d.ip ?? "unknown-ip"}|${d.userAgent ?? "unknown-ua"}`;
  }

  const rows: AdminSessionRow[] = Array.from(byUser.entries()).map(([userId, devices]) => {
    const byFingerprint = new Map<string, AdminDevice[]>();
    for (const d of devices) {
      const fp = fingerprint(d);
      const list = byFingerprint.get(fp) ?? [];
      list.push(d);
      byFingerprint.set(fp, list);
    }
    const distinctDevices = byFingerprint.size;

    // Concurrent-use signal: two distinct devices both active within the
    // same short window at some point in their history.
    const lastSeenPerDevice = Array.from(byFingerprint.values()).map((list) =>
      Math.max(...list.map((d) => new Date(d.lastSeenAt).getTime()))
    );
    let concurrentDevicePairs = 0;
    for (let i = 0; i < lastSeenPerDevice.length; i++) {
      for (let j = i + 1; j < lastSeenPerDevice.length; j++) {
        if (Math.abs(lastSeenPerDevice[i] - lastSeenPerDevice[j]) <= CONCURRENT_WINDOW_MS) {
          concurrentDevicePairs++;
        }
      }
    }

    const lastSeenAt = devices.reduce(
      (max, d) => (new Date(d.lastSeenAt).getTime() > new Date(max).getTime() ? d.lastSeenAt : max),
      devices[0].lastSeenAt
    );

    return {
      userId,
      email: emailById.get(userId) ?? null,
      distinctDevices,
      totalSessions: devices.length,
      lastSeenAt,
      likelyShared: concurrentDevicePairs > 0,
      devices: devices.sort(
        (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      ),
    };
  });

  rows.sort((a, b) => {
    if (a.likelyShared !== b.likelyShared) return a.likelyShared ? -1 : 1;
    if (b.distinctDevices !== a.distinctDevices) return b.distinctDevices - a.distinctDevices;
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  });

  const flaggedCount = rows.filter((r) => r.likelyShared).length;

  return (
    <div className="space-y-6 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/admin" className="hover:text-ink transition">Admin</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Sessions</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
          <MonitorSmartphone className="w-5 h-5 text-ink" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            Device &amp; session log
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-2xl">
            Every device that has ever logged into each account. {rows.length} account
            {rows.length === 1 ? "" : "s"} with login history, {flaggedCount} flagged for
            multiple devices active within {CONCURRENT_WINDOW_MS / 60000} minutes of each other —
            a signal the credentials may be shared.
          </p>
        </div>
      </div>

      <SessionsTable initialRows={rows} />
    </div>
  );
}
