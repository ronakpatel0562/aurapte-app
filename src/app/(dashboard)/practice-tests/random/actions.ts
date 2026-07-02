"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import { isPremiumPlan, type PlanId } from "@/lib/plans";
import { PRACTICE_TEST_FORMAT, RANDOM_PRACTICE_TEST_ID, type Module } from "@/lib/practiceTestFormat";
import { transformQuestionContent } from "@/lib/taskTypeMapper";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";

type QuestionRow = {
  id: string;
  module: string;
  task_type: string;
  title: string;
  content: any;
  difficulty: string | null;
};

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Samples a fresh, random question set for one module using the same
 * per-task_type counts as the fixed practice tests (see
 * lib/practiceTestFormat.ts), then runs it through the same
 * transformQuestionContent normalisation the fixed practice-test exam-clone
 * view uses — so the result renders in ExamRunner identically to
 * practice-tests/[testId]?module=X, just with different questions.
 */
export async function generateRandomPracticeModule(
  module: Module
): Promise<{ questions: RunnerQuestion[]; testId: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;

  if (!isPremiumPlan(plan)) {
    return { error: "Random practice tests are a Pro feature." };
  }

  const rawQuestions: QuestionRow[] = [];

  for (const [taskType, count] of PRACTICE_TEST_FORMAT[module]) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, module, task_type, title, content, difficulty")
      .eq("module", module)
      .eq("task_type", taskType)
      .eq("pool", "shared")
      .eq("is_active", true);

    if (error || !data) continue;
    rawQuestions.push(...shuffle(data as QuestionRow[]).slice(0, count));
  }

  if (rawQuestions.length === 0) {
    return { error: "No active questions available for this module right now." };
  }

  const questions: RunnerQuestion[] = rawQuestions.map((q) => {
    const { content, ...rest } = transformQuestionContent({
      id: q.id,
      module: q.module,
      task_type: q.task_type,
      title: q.title,
      content: q.content,
      difficulty: q.difficulty ?? undefined,
    });
    return { ...rest, content };
  });

  return { questions, testId: RANDOM_PRACTICE_TEST_ID };
}
