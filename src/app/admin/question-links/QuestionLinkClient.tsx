"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Copy, RefreshCw, FileText } from "lucide-react";
import type { TestDefinition } from "@/lib/testDefinitions";

interface LinkStatus {
  totalIds: number;
  linked: number;
  missing: number;
  coveragePct: number;
  perTest: Array<{
    id: string;
    kind: "practice" | "mock";
    expected: number;
    linked: number;
    ready: boolean;
    sections: Array<{ module: string; expected: number; linked: number }>;
  }>;
}

interface SubmitResult {
  linked: number;
  failed: Array<{ pair: any; reason: string }>;
}

/**
 * Client-side controller for the admin linking page. Three sections:
 *   1. Coverage overview — auto-refreshed every 10s while focused.
 *   2. Bulk paste — user pastes `mongoId<whitespace>uuid` lines, we parse
 *      + POST in chunks of 500.
 *   3. Per-test status table — sorted: unready tests first (so the user
 *      sees what to work on), ready tests last.
 */
export default function QuestionLinkClient({ tests }: { tests: TestDefinition[] }) {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk paste state
  const [pasteText, setPasteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);

  async function refresh() {
    try {
      const { data: sessionData } = await (await import("@/lib/supabase/client")).createClient().auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/admin/link-status", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, []);

  async function submitBulk() {
    if (!pasteText.trim()) return;
    setSubmitting(true);
    setLastResult(null);
    try {
      const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const pairs = lines.map((line) => {
        // Accept any whitespace (tab, spaces) as separator.
        const m = line.match(/^(\S+)\s+(\S+)$/);
        if (!m) return null;
        return { legacyMongoId: m[1], questionId: m[2] };
      }).filter(Boolean) as Array<{ legacyMongoId: string; questionId: string }>;

      // Need auth header (the API requires a Bearer token).
      const { data: sessionData } = await (await import("@/lib/supabase/client")).createClient().auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/admin/link-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pairs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setLastResult(data);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Sort tests: unready first.
  const sortedPerTest = useMemo(() => {
    if (!status) return [];
    return [...status.perTest].sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? 1 : -1;
      return a.id.localeCompare(b.id);
    });
  }, [status]);

  return (
    <div className="space-y-6">
      {/* Coverage header */}
      <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Coverage</h2>
            <p className="text-2xs text-mute">
              Across 12 practice tests + 15 mock tests
            </p>
          </div>
          <button
            onClick={refresh}
            className="h-9 px-3 rounded-md border border-hairline bg-canvas text-sm font-medium hover:bg-canvas-soft-2 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading && !status ? (
          <div className="flex items-center gap-2 text-sm text-mute">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading status…
          </div>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div className="text-3xl sm:text-4xl font-bold text-ink tabular-nums">
                {status.linked.toLocaleString()}
                <span className="text-base text-mute font-normal">
                  {" "}/ {status.totalIds.toLocaleString()}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary tabular-nums">{status.coveragePct}%</div>
            </div>
            <div className="h-2 bg-canvas-soft-2 rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-gradient-to-r from-gradient-develop-start to-gradient-develop-end transition-all"
                style={{ width: `${status.coveragePct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-2xs text-mute">
              <span>{status.missing.toLocaleString()} unlinked</span>
              <span>·</span>
              <span>{sortedPerTest.filter((t) => t.ready).length} of {sortedPerTest.length} tests ready</span>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-error-soft border border-error/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-error-deep shrink-0 mt-0.5" />
            <div className="text-xs text-error-deep leading-relaxed">{error}</div>
          </div>
        )}
      </div>

      {/* Bulk paste */}
      <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Bulk paste</h2>
          <button
            onClick={() => copyExample()}
            className="text-2xs font-mono uppercase tracking-wider text-mute hover:text-ink transition flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Copy format
          </button>
        </div>
        <p className="text-2xs text-mute leading-relaxed">
          One pair per line:{" "}
          <code className="font-mono bg-canvas-soft-2 px-1.5 py-0.5 rounded border border-hairline">
            mongoId whitespace questionUuid
          </code>
          . Up to 5,000 lines per submission. Mongo IDs are 24-char hex, UUIDs are the standard 8-4-4-4-12 format.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={10}
          placeholder={"6a04a1368911318eb273e152  abc-1234-...\n6a04a1638911318eb273e153  def-5678-...\n..."}
          className="w-full bg-canvas-soft-2 border border-hairline rounded-lg p-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-primary focus:bg-canvas transition resize-y"
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-2xs text-mute font-mono">
            {pasteText.trim() ? pasteText.split(/\r?\n/).filter((l) => l.trim()).length : 0} lines
          </span>
          <button
            onClick={submitBulk}
            disabled={submitting || !pasteText.trim()}
            className="h-10 px-5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Linking…
              </>
            ) : (
              "Link now"
            )}
          </button>
        </div>

        {lastResult && (
          <div
            className={`p-3 rounded-lg border space-y-2 ${
              lastResult.failed.length > 0
                ? "bg-warning-soft/50 border-warning/20"
                : "bg-success/5 border-success/20"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {lastResult.failed.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-warning-deep" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-success" />
              )}
              <span className={lastResult.failed.length > 0 ? "text-warning-deep" : "text-success"}>
                Linked {lastResult.linked}, failed {lastResult.failed.length}
              </span>
            </div>
            {lastResult.failed.length > 0 && (
              <details className="text-2xs text-mute">
                <summary className="cursor-pointer hover:text-ink">Show failures</summary>
                <ul className="mt-2 space-y-1 font-mono">
                  {lastResult.failed.slice(0, 20).map((f, i) => (
                    <li key={i}>
                      {String(f.pair?.legacyMongoId ?? f.pair)} → {String(f.pair?.questionId ?? f.pair)} · {f.reason}
                    </li>
                  ))}
                  {lastResult.failed.length > 20 && (
                    <li className="text-mute">…and {lastResult.failed.length - 20} more</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Per-test status */}
      <div className="bg-canvas border border-hairline rounded-xl shadow-vercel-card overflow-hidden">
        <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Per-test status</h2>
          <span className="text-2xs text-mute">
            Unready first · {tests.length} total
          </span>
        </div>
        <div className="divide-y divide-hairline">
          {sortedPerTest.map((t) => {
            const pct = t.expected > 0 ? Math.round((t.linked / t.expected) * 100) : 0;
            return (
              <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                <FileText className="w-4 h-4 text-mute shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-semibold text-ink">{t.id}</span>
                    <span className="text-2xs font-mono uppercase tracking-wider text-mute">{t.kind}</span>
                    {t.ready && (
                      <span className="flex items-center gap-1 text-2xs font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Ready
                      </span>
                    )}
                  </div>
                  <div className="text-2xs text-mute mt-0.5">
                    {t.sections.map((s) => `${s.module}: ${s.linked}/${s.expected}`).join(" · ")}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 min-w-[140px]">
                  <div className="h-1.5 flex-1 bg-canvas-soft-2 rounded-full overflow-hidden border border-hairline">
                    <div
                      className={`h-full transition-all ${
                        t.ready ? "bg-success" : pct > 0 ? "bg-warning" : "bg-mute"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-2xs font-mono text-mute tabular-nums w-10 text-right">{pct}%</span>
                </div>
                <div className="text-2xs font-mono text-mute tabular-nums w-20 text-right">
                  {t.linked}/{t.expected}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function copyExample() {
  const example = "6a04a1368911318eb273e152\t00000000-0000-0000-0000-000000000001\n6a04a1638911318eb273e153\t00000000-0000-0000-0000-000000000002";
  navigator.clipboard?.writeText(example).catch(() => {});
}
