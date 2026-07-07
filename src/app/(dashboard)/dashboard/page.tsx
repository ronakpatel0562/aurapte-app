import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapDbToUrlTaskType, getTaskTypeFriendlyName, questionHref } from "@/lib/taskTypeMapper";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import {
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  HelpCircle,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity, { type ActivityEntry } from "@/components/dashboard/RecentActivity";
import { PLANS, planName, isPremiumPlan, type PlanId } from "@/lib/plans";
import { allMockTests, allPracticeTests, getMockTest, getPracticeTest } from "@/lib/testDefinitions";
import { summarizeTestProgress, isTestComplete } from "@/lib/testProgress";

export default async function DashboardPage() {
  const supabase = createClient();

  const user = await getCurrentUser();
  if (!user) return null;

  const userId = user.id;

  // Resolve plan up-front so the hero card can show the right CTA.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = ((profile?.plan as PlanId) || "free") as PlanId;
  const isPremium = isPremiumPlan(plan);
  const userName = profile?.full_name || user.user_metadata?.full_name || "Student";

  // Fetched as two plain queries + an in-memory join rather than a single
  // PostgREST embedded `questions (...)` select: the embed resolves via
  // PostgREST's cached FK graph, which silently 400s (PGRST200) whenever
  // that cache lags a migration — and since the result here was
  // destructured without checking `error`, a stale cache didn't surface
  // as an error, it surfaced as every dashboard stat and Recent Activity
  // entry looking permanently empty.
  const [attempts, { data: moduleCounts }] = await Promise.all([
    (async () => {
      const { data: rawAttempts } = await supabase
        .from("user_attempts")
        .select("id, score, max_score, is_correct, attempted_at, question_id, test_id")
        .eq("user_id", userId)
        .order("attempted_at", { ascending: false });

      const questionIds = Array.from(
        new Set((rawAttempts || []).map((a) => a.question_id).filter(Boolean))
      );
      const { data: relatedQuestions } = questionIds.length
        ? await supabase
            .from("questions")
            .select("id, module, task_type, title")
            .in("id", questionIds)
        : { data: [] as { id: string; module: string; task_type: string; title: string }[] };
      const questionsById = new Map((relatedQuestions || []).map((q) => [q.id, q]));

      return (rawAttempts || []).map((a) => ({
        ...a,
        questions: questionsById.get(a.question_id) ?? null,
      }));
    })(),
    supabase.rpc("count_questions_by_module"),
  ]);

  const totalAttempts = attempts.length || 0;
  const correctAttempts = attempts.filter((a) => a.is_correct).length || 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Question counts per module.
  let questionCounts = { speaking: 0, writing: 0, reading: 0, listening: 0 };
  if (Array.isArray(moduleCounts) && moduleCounts.length > 0) {
    for (const row of moduleCounts) {
      const mod = String(row.module || "").toLowerCase();
      if (mod in questionCounts) {
        questionCounts[mod as keyof typeof questionCounts] = Number(row.count) || 0;
      }
    }
  } else {
    const modules = ["speaking", "writing", "reading", "listening"] as const;
    const results = await Promise.all(
      modules.map(async (m) => {
        const { count } = await supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("module", m)
          .eq("is_active", true)
          .eq("pool", "shared");
        return [m, count || 0] as const;
      })
    );
    for (const [m, c] of results) questionCounts[m] = c;
  }

  // Test-level progress — group question attempts by test_id (stamped by
  // the mock/practice test runners) since there's no dedicated "test
  // session" table. See src/lib/testProgress.ts for the aggregation.
  const testProgressMap = summarizeTestProgress(
    attempts.map((a: any) => ({
      test_id: a.test_id,
      question_id: a.question_id,
      score: a.score,
      max_score: a.max_score,
      attempted_at: a.attempted_at,
    }))
  );

  const totalMockTests = allMockTests().length;
  const totalPracticeTests = allPracticeTests().length;
  const completedTestEntries: ActivityEntry[] = [];
  let mockTestsCompleted = 0;
  let practiceTestsCompleted = 0;

  Array.from(testProgressMap.values()).forEach((progress) => {
    const mockDef = getMockTest(progress.testId);
    const practiceDef = getPracticeTest(progress.testId);
    const def = mockDef ?? practiceDef;
    if (!def) return;

    if (!isTestComplete(progress, def.totalQuestions)) return;

    if (mockDef) mockTestsCompleted += 1;
    else practiceTestsCompleted += 1;

    completedTestEntries.push({
      kind: "test",
      id: progress.testId,
      title: def.title,
      testKind: mockDef ? "mock" : "practice",
      scorePercent: progress.scorePercent,
      date: progress.lastAttemptedAt,
      href: mockDef ? `/mock-tests/${def.id}` : `/practice-tests/${def.id}`,
    });
  });
  const testsCompleted = mockTestsCompleted + practiceTestsCompleted;
  const totalTests = totalMockTests + totalPracticeTests;
  const averageTestScore =
    completedTestEntries.length > 0
      ? Math.round(
          completedTestEntries.reduce((sum, t) => sum + (t.kind === "test" ? t.scorePercent : 0), 0) /
            completedTestEntries.length
        )
      : null;

  // Standalone question attempts — practice taken outside of a test
  // (test_id null). Attempts that belong to a test are already represented
  // by their single "test completed" entry above, so they're excluded here
  // to avoid listing the same submissions twice.
  const standaloneEntries: ActivityEntry[] = attempts
    .filter((a: any) => !a.test_id && a.questions)
    .map((a: any) => ({
      kind: "question" as const,
      id: a.id,
      score: a.score,
      maxScore: a.max_score,
      isCorrect: a.is_correct,
      date: a.attempted_at,
      module: a.questions.module,
      taskType: a.questions.task_type,
      title: a.questions.title || "Untitled Question",
      href: questionHref(a.questions.module, a.questions.task_type, a.questions.id),
    }));

  const recentActivityEntries = [...completedTestEntries, ...standaloneEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  const modules = [
    {
      name: "Speaking",
      description: "Read Aloud, Repeat Sentence, Describe Image & more.",
      count: questionCounts.speaking,
      href: "/questions/speaking",
      icon: Mic,
      gradientClass: "from-gradient-develop-start to-gradient-develop-end",
    },
    {
      name: "Writing",
      description: "Summarize Written Text & Write an Email.",
      count: questionCounts.writing,
      href: "/questions/writing",
      icon: PenTool,
      gradientClass: "from-gradient-preview-start to-gradient-preview-end",
    },
    {
      name: "Reading",
      description: "Fill Blanks, Paragraph Reorder & Multiple Choice.",
      count: questionCounts.reading,
      href: "/questions/reading",
      icon: BookOpenCheck,
      gradientClass: "from-gradient-ship-start to-gradient-ship-end",
    },
    {
      name: "Listening",
      description: "Dictation, Highlight Incorrect Words, Spoken Summary.",
      count: questionCounts.listening,
      href: "/questions/listening",
      icon: Headphones,
      gradientClass: "from-gradient-develop-start to-gradient-preview-start",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 py-2 sm:py-4 select-none">
      {/* Welcome / hero */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold text-ink">
          Welcome back, {userName}
        </h1>
        <p className="text-sm sm:text-base text-mute">
          Here&apos;s an overview of your PTE Academic preparation progress.
        </p>
      </div>

      {/* Plan upgrade nudge (only for free users) — sits ABOVE stats so
          it's the first thing they see after the greeting. */}
      {!isPremium && (
        <Link
          href="/billing"
          className="card-hover relative block bg-canvas border border-hairline rounded-xl p-5 sm:p-6 shadow-vercel-card overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gradient-brand-start to-gradient-brand-end flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-semibold text-ink">
                    Upgrade to {PLANS.premium.name}
                  </h2>
                  <span className="text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-warning-soft text-warning-deep border border-warning/20">
                    You&apos;re on {planName(plan)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-xl">
                  {PLANS.premium.tagline} {PLANS.premium.priceInr > 0 && (
                    <>Starts at ₹{PLANS.premium.priceInr}/{PLANS.premium.billingPeriod}.</>
                  )}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shrink-0">
              View plans
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      )}

      {/* Stats — single row on desktop, 2x2 on tablet, single column on phone.
          Progress statistics are an Aura Pro perk; Starter sees a locked upsell instead. */}
      {isPremium ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Tests Completed"
            value={`${testsCompleted}/${totalTests}`}
            desc="Mock + practice tests finished"
            icon={<Award className="w-4 h-4 text-mute" />}
          />
          <StatCard
            title="Average Test Score"
            value={averageTestScore !== null ? `${averageTestScore}%` : "—"}
            desc={testsCompleted > 0 ? `Across ${testsCompleted} completed test${testsCompleted === 1 ? "" : "s"}` : "Complete a test to see this"}
            icon={<TrendingUp className="w-4 h-4 text-mute" />}
            trend={averageTestScore !== null && averageTestScore >= 70 ? { value: "On track", positive: true } : undefined}
          />
          <StatCard
            title="Questions Attempted"
            value={totalAttempts}
            desc="Total practice submissions"
            icon={<HelpCircle className="w-4 h-4 text-mute" />}
          />
          <StatCard
            title="Accuracy Rate"
            value={`${accuracy}%`}
            desc="Correct vs total attempts"
            icon={<BookOpenCheck className="w-4 h-4 text-mute" />}
          />
        </div>
      ) : (
        <Link
          href="/billing"
          className="card-hover flex items-center justify-between gap-4 bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-mute" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Progress statistics are a Pro feature</p>
              <p className="text-xs text-mute mt-0.5">
                Upgrade to Aura Pro to track tests completed, scores, and accuracy.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-mute shrink-0" />
        </Link>
      )}

      {/* Practice Modules grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Practice Modules
          </h3>
          <Link
            href="/practice-tests"
            className="text-2xs font-mono text-mute hover:text-ink transition uppercase tracking-wider"
          >
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.name}
                href={mod.href}
                className="card-hover group relative bg-canvas border border-hairline rounded-xl p-6 flex flex-col justify-between overflow-hidden min-h-[160px]"
              >
                {/* Top gradient stripe — same pattern on every card now.
                    No more rainbow-only-on-hover inconsistency. */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.gradientClass}`} />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${mod.gradientClass} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-ink group-hover:text-link transition">
                      {mod.name}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-mute leading-relaxed pr-2 line-clamp-2">
                    {mod.description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-hairline">
                  <span className="text-xs font-mono bg-canvas-soft-2 border border-hairline px-2.5 py-1 rounded text-body font-medium">
                    {mod.count} {mod.count === 1 ? "question" : "questions"}
                  </span>
                  <span className="text-xs font-medium text-mute group-hover:text-ink transition flex items-center gap-1.5">
                    Start practice
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity — a single feed mixing completed tests and
          standalone question practice, newest first. Also an Aura Pro
          perk, matching the stats gate above. */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Recent Activity
        </h3>
        {isPremium ? (
          <RecentActivity entries={recentActivityEntries} />
        ) : (
          <Link
            href="/billing"
            className="card-hover flex items-center justify-between gap-4 bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-canvas-soft-2 border border-hairline flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-mute" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Recent activity is a Pro feature</p>
                <p className="text-xs text-mute mt-0.5">
                  Upgrade to Aura Pro to see your completed tests and last submissions.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-mute shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
