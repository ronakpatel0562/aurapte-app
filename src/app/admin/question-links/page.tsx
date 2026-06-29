import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Link2, FileText, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  allPracticeTests,
  allMockTests,
  type TestDefinition,
} from "@/lib/testDefinitions";
import QuestionLinkClient from "./QuestionLinkClient";

/**
 * /admin/question-links
 *
 * Owner-only page that maps Mongo ObjectIDs (from PracticeTest.txt +
 * MockTest.txt) to Supabase question UUIDs. Used to make the test runner
 * return the *exact* questions your JSON files named, instead of falling
 * back to "latest N for module X".
 *
 * How the data flows:
 *   - Server fetches coverage stats from /api/admin/link-status.
 *   - Server passes the test list + any unlinked Mongo IDs to the client.
 *   - Client renders:
 *       1. Coverage header (X / 1532 linked, % complete)
 *       2. Per-test progress list with "Ready" badges
 *       3. Bulk paste box: paste lines like
 *            6a04a1368911318eb273e152  abc-123-...
 *          and the client validates + POSTs to /api/admin/link-questions.
 *
 * Gating:
 *   - Authenticated user required (any logged-in account can use this
 *     page; tighten later when you add an admin role).
 *   - Service role key must be in env (the API needs it; the UI tells
 *     you if it's missing).
 */
export default async function QuestionLinksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/question-links");

  // Pre-compute the union of all Mongo IDs across all tests so we can
  // hand them to the bulk paste box as a checklist.
  const practice = allPracticeTests();
  const mock = allMockTests();
  const tests: TestDefinition[] = [...practice, ...mock];

  return (
    <div className="space-y-6 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Question Links</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5 text-ink" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">
            Link Mongo IDs → Supabase questions
          </h1>
          <p className="text-sm text-mute leading-relaxed max-w-2xl">
            The two source files (PracticeTest.txt, MockTest.txt) reference{" "}
            <span className="font-mono text-ink">1,532</span> questions by their
            original MongoDB ObjectIDs. Until each Mongo ID is linked to a Supabase
            question UUID, the test runner falls back to &ldquo;latest N active for
            this module&rdquo;. Linking is a one-time operation per question.
          </p>
        </div>
      </div>

      {/* Two-step instructions */}
      <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card space-y-3">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          How to link
        </h2>
        <ol className="space-y-2 text-sm text-body list-decimal pl-5">
          <li>
            Run the SQL migration at{" "}
            <code className="text-2xs font-mono bg-canvas-soft-2 px-1.5 py-0.5 rounded border border-hairline">
              supabase/migrations/20260628_legacy_mongo_id.sql
            </code>{" "}
            in the Supabase SQL editor (or{" "}
            <code className="text-2xs font-mono">supabase db push</code>). It
            adds the <code className="text-2xs font-mono">legacy_mongo_id</code>{" "}
            column and supporting indexes.
          </li>
          <li>
            Import your questions with their Mongo IDs preserved. The cleanest
            way is to add <code className="text-2xs font-mono">legacy_mongo_id</code>{" "}
            to the insert payload during your existing import. If your
            questions are already in Supabase without that field, use the bulk
            paste box below to map them one at a time.
          </li>
          <li>
            Each line: <code className="text-2xs font-mono">mongoId uuid</code>{" "}
            (whitespace-separated, one per line). Up to 5,000 lines per
            submission. The page POSTs to{" "}
            <code className="text-2xs font-mono">/api/admin/link-questions</code>{" "}
            and reports any failures back.
          </li>
        </ol>

        {!process.env.SUPABASE_SERVICE_ROLE_KEY && (
          <div className="flex items-start gap-2 p-3 bg-warning-soft/50 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning-deep shrink-0 mt-0.5" />
            <div className="text-xs text-warning-deep leading-relaxed">
              <strong>Service role key not set.</strong> Add{" "}
              <code className="font-mono text-2xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              to <code className="font-mono text-2xs">.env.local</code> for the
              link API to work. The status endpoint can still read coverage
              without it.
            </div>
          </div>
        )}
      </div>

      <QuestionLinkClient tests={tests} />
    </div>
  );
}
