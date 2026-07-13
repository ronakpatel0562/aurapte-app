"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronDown, AlertTriangle } from "lucide-react";

export interface AdminDevice {
  sessionId: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface AdminSessionRow {
  userId: string;
  email: string | null;
  distinctDevices: number;
  totalSessions: number;
  lastSeenAt: string;
  likelyShared: boolean;
  devices: AdminDevice[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsTable({ initialRows }: { initialRows: AdminSessionRow[] }) {
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialRows.filter((r) => {
      if (flaggedOnly && !r.likelyShared) return false;
      if (!q) return true;
      return (r.email ?? "").toLowerCase().includes(q);
    });
  }, [initialRows, query, flaggedOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-hairline rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setFlaggedOnly((v) => !v)}
          className={`text-xs font-medium px-3 py-1.5 rounded-md border transition ${
            flaggedOnly
              ? "bg-warning-soft/50 border-warning/30 text-warning-deep"
              : "border-hairline text-mute hover:text-ink"
          }`}
        >
          Flagged only
        </button>
      </div>

      <div className="border border-hairline rounded-xl overflow-hidden shadow-vercel-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas-soft-2 text-mute text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">Devices</th>
                <th className="text-left font-semibold px-4 py-3">Total logins</th>
                <th className="text-left font-semibold px-4 py-3">Last active</th>
                <th className="text-left font-semibold px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((row) => {
                const isOpen = expanded === row.userId;
                return (
                  <React.Fragment key={row.userId}>
                    <tr
                      className="bg-canvas hover:bg-canvas-soft transition cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : row.userId)}
                    >
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="font-medium text-ink flex items-center gap-1.5">
                          {row.email ?? "(no email)"}
                          {row.likelyShared && (
                            <span
                              title="Multiple devices active within the same short window"
                              className="inline-flex items-center gap-1 text-2xs font-semibold uppercase px-1.5 py-0.5 rounded bg-warning-soft/50 text-warning-deep border border-warning/20"
                            >
                              <AlertTriangle className="w-3 h-3" /> Shared?
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.distinctDevices}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-mute">{row.totalSessions}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-mute">
                        {formatDateTime(row.lastSeenAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronDown
                          className={`w-4 h-4 text-mute transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-canvas-soft-2">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="border border-hairline rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-canvas text-mute uppercase tracking-wider">
                                <tr>
                                  <th className="text-left font-semibold px-3 py-2">IP address</th>
                                  <th className="text-left font-semibold px-3 py-2">User agent</th>
                                  <th className="text-left font-semibold px-3 py-2">First seen</th>
                                  <th className="text-left font-semibold px-3 py-2">Last seen</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-hairline">
                                {row.devices.map((d) => (
                                  <tr key={d.sessionId} className="bg-canvas">
                                    <td className="px-3 py-2 font-mono">{d.ip ?? "—"}</td>
                                    <td className="px-3 py-2 max-w-[320px] truncate" title={d.userAgent ?? ""}>
                                      {d.userAgent ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-mute whitespace-nowrap">
                                      {formatDateTime(d.createdAt)}
                                    </td>
                                    <td className="px-3 py-2 text-mute whitespace-nowrap">
                                      {formatDateTime(d.lastSeenAt)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-mute text-sm">
                    No accounts match your filters.
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
