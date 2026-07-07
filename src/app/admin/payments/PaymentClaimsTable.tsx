"use client";

import React, { useMemo, useState, useTransition } from "react";
import { CheckCircle2, XCircle, Clock, ImageIcon, Loader2 } from "lucide-react";
import { approveClaim, rejectClaim, getScreenshotUrl } from "./actions";
import { PLANS } from "@/lib/plans";

export interface AdminClaimRow {
  id: string;
  userId: string;
  email: string | null;
  planId: "free" | "premium";
  months: number;
  reference: string;
  screenshotPath: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<AdminClaimRow["status"], string> = {
  pending: "text-warning-deep bg-warning-soft/50 border-warning/20",
  approved: "text-success bg-success/10 border-success/20",
  rejected: "text-error bg-error-soft/50 border-error/20",
};

export default function PaymentClaimsTable({ initialRows }: { initialRows: AdminClaimRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "pending" ? rows.filter((r) => r.status === "pending") : rows),
    [rows, filter],
  );

  function patch(id: string, patch: Partial<AdminClaimRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleApprove(row: AdminClaimRow) {
    setError(null);
    setBusyId(row.id);
    startTransition(async () => {
      const res = await approveClaim(row.id);
      setBusyId(null);
      if (res.error) setError(res.error);
      else patch(row.id, { status: "approved" });
    });
  }

  function handleReject(row: AdminClaimRow) {
    const note = prompt("Reason for rejecting (optional):") ?? undefined;
    setError(null);
    setBusyId(row.id);
    startTransition(async () => {
      const res = await rejectClaim(row.id, note);
      setBusyId(null);
      if (res.error) setError(res.error);
      else patch(row.id, { status: "rejected" });
    });
  }

  async function handleViewScreenshot(path: string) {
    setError(null);
    const res = await getScreenshotUrl(path);
    if (res.error) setError(res.error);
    else if (res.url) setScreenshotUrl(res.url);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 text-xs font-medium">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md border transition ${
              filter === f
                ? "bg-canvas-soft-2 border-hairline text-ink"
                : "border-transparent text-mute hover:text-ink"
            }`}
          >
            {f === "pending" ? "Pending" : "All"}
          </button>
        ))}
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
                <th className="text-left font-semibold px-4 py-3">Plan</th>
                <th className="text-left font-semibold px-4 py-3">Reference</th>
                <th className="text-left font-semibold px-4 py-3">Submitted</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((row) => {
                const busy = busyId === row.id && pending;
                return (
                  <tr key={row.id} className="bg-canvas hover:bg-canvas-soft transition">
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="font-medium text-ink">{row.email ?? row.userId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {PLANS[row.planId]?.name ?? row.planId} · {row.months}mo
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink">{row.reference}</span>
                        {row.screenshotPath && (
                          <button
                            onClick={() => handleViewScreenshot(row.screenshotPath!)}
                            className="text-mute hover:text-ink transition"
                            aria-label="View screenshot"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-mute whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[row.status]}`}
                      >
                        {row.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                        {row.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {row.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "pending" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={busy}
                            onClick={() => handleApprove(row)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-ink text-canvas hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approve"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleReject(row)}
                            className="text-xs font-medium px-2.5 py-1 rounded-md border border-hairline text-error hover:bg-error-soft/50 transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-mute">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-mute text-sm">
                    No claims to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {screenshotUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setScreenshotUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Payment screenshot"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
