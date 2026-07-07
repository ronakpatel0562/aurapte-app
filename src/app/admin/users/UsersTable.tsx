"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Search, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import { activatePlan, extendPlan, revokeAccess, deleteUserAccount } from "./actions";
import { PLANS, type PlanId } from "@/lib/plans";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  plan: "free" | "premium";
  planExpiry: string | null;
}

function isActive(row: AdminUserRow): boolean {
  return !!row.planExpiry && new Date(row.planExpiry).getTime() > Date.now();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

const DURATIONS = [1, 3, 6, 12];

export default function UsersTable({ initialRows }: { initialRows: AdminUserRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planChoice, setPlanChoice] = useState<Record<string, PlanId>>({});
  const [monthsChoice, setMonthsChoice] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && !isActive(r)) return false;
      if (statusFilter === "inactive" && isActive(r)) return false;
      if (!q) return true;
      return (
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.fullName ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  function patchRow(id: string, patch: Partial<AdminUserRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function run(id: string, fn: () => Promise<{ error?: string }>) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.error) setError(res.error);
    });
  }

  function handleActivate(row: AdminUserRow) {
    const plan = planChoice[row.id] ?? "premium";
    const months = monthsChoice[row.id] ?? 1;
    run(row.id, async () => {
      const res = await activatePlan(row.id, plan, months);
      if (!res.error) {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);
        patchRow(row.id, { plan, planExpiry: expiry.toISOString() });
      }
      return res;
    });
  }

  function handleExtend(row: AdminUserRow) {
    const months = monthsChoice[row.id] ?? 1;
    run(row.id, async () => {
      const res = await extendPlan(row.id, months);
      if (!res.error) {
        const base =
          row.planExpiry && new Date(row.planExpiry).getTime() > Date.now()
            ? new Date(row.planExpiry)
            : new Date();
        base.setMonth(base.getMonth() + months);
        patchRow(row.id, { planExpiry: base.toISOString() });
      }
      return res;
    });
  }

  function handleRevoke(row: AdminUserRow) {
    if (!confirm(`Revoke access for ${row.email}? They'll be paywalled immediately.`)) return;
    run(row.id, async () => {
      const res = await revokeAccess(row.id);
      if (!res.error) patchRow(row.id, { planExpiry: null });
      return res;
    });
  }

  function handleDelete(row: AdminUserRow) {
    if (!confirm(`Permanently delete ${row.email}'s account? This cannot be undone.`)) return;
    run(row.id, async () => {
      const res = await deleteUserAccount(row.id);
      if (!res.error) setRows((prev) => prev.filter((r) => r.id !== row.id));
      return res;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-hairline rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 text-xs font-medium">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md border transition ${
                statusFilter === s
                  ? "bg-canvas-soft-2 border-hairline text-ink"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : "Unpaid / expired"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-error bg-error-soft/50 border border-error/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="border border-hairline rounded-xl overflow-hidden shadow-vercel-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas-soft-2 text-mute text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">Signed up</th>
                <th className="text-left font-semibold px-4 py-3">Plan</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Expires</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((row) => {
                const active = isActive(row);
                const busy = busyId === row.id && pending;
                return (
                  <tr key={row.id} className="bg-canvas hover:bg-canvas-soft transition">
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="font-medium text-ink">{row.email ?? "(no email)"}</div>
                      {row.fullName && <div className="text-xs text-mute">{row.fullName}</div>}
                    </td>
                    <td className="px-4 py-3 text-mute whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{PLANS[row.plan]?.name ?? row.plan}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {active ? (
                        <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-mute text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> No access
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mute whitespace-nowrap">{formatDate(row.planExpiry)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          value={planChoice[row.id] ?? "premium"}
                          onChange={(e) =>
                            setPlanChoice((p) => ({ ...p, [row.id]: e.target.value as PlanId }))
                          }
                          className="text-xs bg-canvas border border-hairline rounded-md px-1.5 py-1"
                        >
                          <option value="premium">Pro</option>
                          <option value="free">Starter</option>
                        </select>
                        <select
                          value={monthsChoice[row.id] ?? 1}
                          onChange={(e) =>
                            setMonthsChoice((p) => ({ ...p, [row.id]: Number(e.target.value) }))
                          }
                          className="text-xs bg-canvas border border-hairline rounded-md px-1.5 py-1"
                        >
                          {DURATIONS.map((m) => (
                            <option key={m} value={m}>{m}mo</option>
                          ))}
                        </select>
                        <button
                          disabled={busy}
                          onClick={() => handleActivate(row)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-ink text-canvas hover:opacity-90 transition disabled:opacity-50"
                        >
                          Activate
                        </button>
                        <button
                          disabled={busy || !active}
                          onClick={() => handleExtend(row)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-hairline hover:bg-canvas-soft-2 transition disabled:opacity-50"
                        >
                          Extend
                        </button>
                        <button
                          disabled={busy || !row.planExpiry}
                          onClick={() => handleRevoke(row)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-hairline text-warning-deep hover:bg-warning-soft/50 transition disabled:opacity-50"
                        >
                          Revoke
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleDelete(row)}
                          title="Delete account"
                          className="p-1.5 rounded-md border border-hairline text-error hover:bg-error-soft/50 transition disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-mute text-sm">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
