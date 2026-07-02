import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { getMockTest } from "@/lib/testDefinitions";
import { hasAccessToTest, type PlanId } from "@/lib/plans";
import { transformQuestionContent } from "@/lib/taskTypeMapper";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import MockExamRunner, { type MockModuleQuestions } from "@/components/exam-runner/MockExamRunner";

interface PageProps {
  params: { testId: string };
}

// Real PTE exam order: Part 1 (Speaking, then Writing) -> Part 2 (Reading)
// -> Part 3 (Listening). MockExamRunner relies on this ordering to know
// when Part 2 (Reading) has finished and the optional break should show.
const MODULE_ORDER = ["speaking", "writing", "reading", "listening"] as const;

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

  // Questions are precomputed into `test_questions` by
  // scripts/build_test_question_mapping.py (exact original_id match +
  // same-module backfill drawing from the 'shared' and 'mock_only'
  // pools, run once) — one indexed query here instead of resolving live
  // on every page load. See the practice-test file for the full
  // rationale.
  type MappedRow = {
    module: string;
    position: number;
    question: {
      id: string;
      module: string;
      task_type: string;
      title: string;
      content: any;
      difficulty: string | null;
    } | null;
  };

  const { data: mapped } = await supabase
    .from("test_questions")
    .select("module, position, question:questions!inner(id, module, task_type, title, content, difficulty)")
    .eq("test_id", def.id)
    .eq("question.is_active", true)
    .order("module", { ascending: true })
    .order("position", { ascending: true });

  const questionsBySectionModule = new Map<string, RunnerQuestion[]>();
  for (const row of (mapped ?? []) as unknown as MappedRow[]) {
    if (!row.question) continue;
    const { content, ...rest } = transformQuestionContent({
      id: row.question.id,
      module: row.question.module,
      task_type: row.question.task_type,
      title: row.question.title,
      content: row.question.content,
      difficulty: row.question.difficulty ?? undefined,
    });
    const runnerQ = { ...rest, content } as RunnerQuestion;
    if (!questionsBySectionModule.has(row.module)) questionsBySectionModule.set(row.module, []);
    questionsBySectionModule.get(row.module)!.push(runnerQ);
  }

  const modules: MockModuleQuestions[] = MODULE_ORDER.filter((m) => questionsBySectionModule.has(m)).map(
    (module) => ({ module, questions: questionsBySectionModule.get(module) ?? [] })
  );
  const totalQuestions = modules.reduce((sum, m) => sum + m.questions.length, 0);

  if (totalQuestions === 0) {
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
      </div>
    );
  }

  return (
    <MockExamRunner
      testTitle={def.title}
      testId={def.id}
      modules={modules}
      userId={user.id}
      backHref="/mock-tests"
    />
  );
}
