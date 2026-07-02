import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight, BookOpenCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { getPracticeTest } from "@/lib/testDefinitions";
import { hasAccessToTest, type PlanId } from "@/lib/plans";
import { transformQuestionContent } from "@/lib/taskTypeMapper";
import QuestionRunner from "@/components/test-runner/QuestionRunner";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import ExamRunner from "@/components/exam-runner/ExamRunner";

interface PageProps {
  params: { testId: string };
  searchParams: { module?: string };
}

export default async function PracticeTestRunnerPage({ params, searchParams }: PageProps) {
  const def = getPracticeTest(params.testId);
  if (!def) notFound();

  // A module row on the practice-tests card deep-links here with ?module=speaking
  // so it starts just that section instead of the full mixed-module test.
  const moduleFilter = searchParams?.module?.toLowerCase();
  const sections = moduleFilter
    ? def.sections.filter((s) => s.module === moduleFilter)
    : def.sections;
  if (moduleFilter && sections.length === 0) notFound();

  const title = moduleFilter ? `${def.title} — ${capitalize(moduleFilter)}` : def.title;

  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;

  if (!hasAccessToTest(plan, "practiceTests", def.testNumber)) {
    // Send free-tier users to billing when they try to open a locked test.
    redirect(`/billing?from=${def.id}`);
  }

  // Questions are precomputed into `test_questions` by
  // scripts/build_test_question_mapping.py (exact original_id match +
  // same-module/task_type backfill, run once) — one indexed query here
  // instead of resolving live on every page load.
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
    .in("module", sections.map((s) => s.module))
    .eq("question.is_active", true)
    .order("module", { ascending: true })
    .order("position", { ascending: true });

  const rowsByModule = new Map<string, MappedRow["question"][]>();
  for (const row of (mapped ?? []) as unknown as MappedRow[]) {
    if (!row.question) continue;
    if (!rowsByModule.has(row.module)) rowsByModule.set(row.module, []);
    rowsByModule.get(row.module)!.push(row.question);
  }

  const questions: RunnerQuestion[] = sections.flatMap((s) =>
    (rowsByModule.get(s.module) ?? []).map((r) => ({
      id: r!.id,
      module: r!.module,
      task_type: r!.task_type,
      title: r!.title,
      content: r!.content,
      difficulty: r!.difficulty ?? undefined,
    }))
  );

  // Every single-module deep link opens in the fullscreen exam-clone runner
  // so the practice test matches the real PTE test driver; only the full
  // mixed test (no ?module=) keeps the dashboard-styled QuestionRunner.
  const isExamCloneModule =
    moduleFilter === "speaking" ||
    moduleFilter === "writing" ||
    moduleFilter === "reading" ||
    moduleFilter === "listening";
  if (isExamCloneModule && questions.length > 0) {
    const examQuestions = questions.map((q) => {
      const { content, ...rest } = transformQuestionContent(q);
      return { ...rest, content };
    });
    return (
      <ExamRunner
        testTitle={def.title}
        testId={def.id}
        module={moduleFilter as "speaking" | "writing" | "reading" | "listening"}
        questions={examQuestions}
        userId={user.id}
        backHref="/practice-tests"
      />
    );
  }

  return (
    <div className="space-y-4 py-2 sm:py-4 select-none">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/practice-tests" className="hover:text-ink transition">Practice Tests</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold truncate">{title}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <BookOpenCheck className="w-5 h-5 text-mute" />
        <h1 className="text-xl sm:text-2xl font-semibold text-ink">{title}</h1>
      </div>

      {questions.length === 0 ? (
        <NoQuestionsPanel title={title} sections={sections} />
      ) : (
        <QuestionRunner
          questions={questions}
          userId={user.id}
          testId={def.id}
          config={{
            title,
            sections: sections.map((s) => capitalize(s.module)),
            sectionModules: Object.fromEntries(
              sections.map((s) => [capitalize(s.module), s.module])
            ),
            totalTimeSeconds: 0, // self-paced for practice
            perQuestionSeconds: 0,
            showSectionSummary: false,
            submitLabel: "Submit Practice Test",
            isMock: false,
          }}
        />
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function NoQuestionsPanel({ title, sections }: { title: string; sections: { module: string; targetCount: number }[] }) {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-8 text-center shadow-vercel-card space-y-3">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-mute max-w-md mx-auto">
        No active questions in the database for this test yet. Once questions are imported for the
        modules below, this test will become available.
      </p>
      <ul className="inline-flex flex-wrap gap-2 justify-center">
        {sections.map((s) => (
          <li
            key={s.module}
            className="px-2.5 py-1 rounded-full text-2xs font-mono uppercase tracking-wider bg-canvas-soft-2 border border-hairline text-body"
          >
            {s.module} · needs {s.targetCount}
          </li>
        ))}
      </ul>
    </div>
  );
}
