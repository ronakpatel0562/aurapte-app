import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { getMockTest } from "@/lib/testDefinitions";
import { hasAccessToTest, type PlanId } from "@/lib/plans";
import QuestionRunner from "@/components/test-runner/QuestionRunner";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";

interface PageProps {
  params: { testId: string };
}

export default async function MockTestRunnerPage({ params }: PageProps) {
  const def = getMockTest(params.testId);
  if (!def) notFound();

  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;

  if (!hasAccessToTest(plan, "mockTests", def.testNumber)) {
    redirect(`/billing?from=${def.id}`);
  }

  type QRow = {
    id: string;
    module: string;
    task_type: string;
    title: string;
    content: any;
    difficulty: string | null;
    legacy_mongo_id?: string | null;
  };

  // Same fetch strategy as practice tests — exact legacy_mongo_id first,
  // fall back to latest N for the module. See the practice-test file
  // for the full rationale.
  const sectionQueries = await Promise.all(
    def.sections.map(async (s) => {
      const ids = s.legacyIds;
      let rows: QRow[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("questions")
          .select("id, module, task_type, title, content, difficulty, legacy_mongo_id")
          .in("legacy_mongo_id", ids)
          .eq("is_active", true);
        rows = (data ?? []) as QRow[];
        if (rows.length > 0) {
          const byId = new Map(rows.map((r) => [r.legacy_mongo_id as string, r]));
          rows = ids.map((id) => byId.get(id)).filter((r): r is QRow => Boolean(r));
        }
      }
      if (rows.length === 0) {
        const { data } = await supabase
          .from("questions")
          .select("id, module, task_type, title, content, difficulty, legacy_mongo_id")
          .eq("module", s.module)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(s.targetCount);
        rows = (data ?? []) as QRow[];
      }
      return { section: s, rows };
    })
  );

  const questions: RunnerQuestion[] = sectionQueries.flatMap(({ rows }) =>
    rows.map((r) => ({
      id: r.id,
      module: r.module,
      task_type: r.task_type,
      title: r.title,
      content: r.content,
      difficulty: r.difficulty ?? undefined,
    }))
  );

  return (
    <div className="space-y-4 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/mock-tests" className="hover:text-ink transition">Mock Tests</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold truncate">{def.title}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-mute" />
        <h1 className="text-xl sm:text-2xl font-semibold text-ink">{def.title}</h1>
      </div>

      {questions.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-xl p-8 text-center shadow-vercel-card space-y-3">
          <h2 className="text-lg font-semibold text-ink">{def.title}</h2>
          <p className="text-sm text-mute max-w-md mx-auto">
            No active questions in the database for this mock test yet. The simulation will become
            available once questions are imported for these modules.
          </p>
          <ul className="inline-flex flex-wrap gap-2 justify-center">
            {def.sections.map((s) => (
              <li
                key={s.module}
                className="px-2.5 py-1 rounded-full text-2xs font-mono uppercase tracking-wider bg-canvas-soft-2 border border-hairline text-body"
              >
                {s.module} · needs {s.targetCount}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <QuestionRunner
          questions={questions}
          userId={user.id}
          config={{
            title: def.title,
            sections: def.sections.map((s) => capitalize(s.module)),
            sectionModules: Object.fromEntries(
              def.sections.map((s) => [capitalize(s.module), s.module])
            ),
            // Mock test has a hard 2-hour total timer matching the real PTE
            // exam duration. Per-question timer is off by default — the real
            // PTE uses per-item time windows that vary by task type, and
            // simulating those correctly needs more design work.
            totalTimeSeconds: 2 * 60 * 60,
            perQuestionSeconds: 0,
            showSectionSummary: true,
            submitLabel: "Submit Mock Exam",
            isMock: true,
          }}
        />
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
