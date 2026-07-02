import React from "react";
import Link from "next/link";
import { ChevronRight, BookOpenCheck, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS, planName, hasAccessToTest, isPremiumPlan, type PlanId } from "@/lib/plans";
import PracticeTestCard from "@/components/practice-tests/PracticeTestCard";
import { allPracticeTests } from "@/lib/testDefinitions";

export default async function PracticeTestsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = ((profile?.plan as PlanId) || "free") as PlanId;
  const isPremium = isPremiumPlan(plan);
  const total = allPracticeTests().length;

  // Practice Tests are organised into 4 sections matching the PTE modules
  // (Speaking, Writing, Reading, Listening) so students can identify which
  // module a question belongs to. Free tier = first N tests (see PLANS.free.limits.practiceTests).
  const practiceTests = Array.from({ length: total }, (_, i) => {
    const testNum = i + 1;
    return {
      id: `practice-test-${testNum}`,
      number: testNum,
      isLocked: !hasAccessToTest(plan, "practiceTests", testNum),
    };
  });

  // Real "Attempted" status per test/module — attempt rows are stamped with
  // test_id + module by the runner at submit time (see QuestionRunner /
  // ExamRunner). One query for every card instead of N.
  const { data: attemptRows } = await supabase
    .from("user_attempts")
    .select("test_id, module")
    .eq("user_id", user.id)
    .not("test_id", "is", null);

  const attemptedByTest = new Map<string, Set<string>>();
  for (const row of attemptRows ?? []) {
    if (!row.test_id || !row.module) continue;
    if (!attemptedByTest.has(row.test_id)) attemptedByTest.set(row.test_id, new Set());
    attemptedByTest.get(row.test_id)!.add(row.module);
  }

  return (
    <div className="space-y-8 py-2 sm:py-4 select-none font-geist">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Practice Tests</span>
      </div>

      <div className="relative bg-canvas border border-hairline rounded-xl p-6 sm:p-8 shadow-vercel-card overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-tr from-gradient-preview-start to-gradient-preview-end opacity-10 blur-2xl" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-preview-start via-gradient-preview-end to-gradient-ship-start" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-6 h-6 text-ink" />
              <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">Practice Tests</h1>
            </div>
            <p className="text-sm text-mute max-w-xl leading-relaxed">
              Test-format practice sessions grouped by module so you always know which PTE section a question belongs to. Short, focused evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPremium ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/5 border border-success/15 shadow-sm text-success text-xs font-semibold uppercase font-mono">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>All Tests Unlocked</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-start md:items-end justify-center px-4 py-3 rounded-lg bg-warning-soft/30 border border-warning/15 shrink-0">
                <span className="text-2xs font-mono text-warning-deep uppercase tracking-wider font-semibold">{planName(plan)}</span>
                <span className="text-2xl font-bold text-ink">
                  {PLANS.free.limits.practiceTests} <span className="text-xs font-normal text-mute">/ {total} Unlocked</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href={isPremium ? "/practice-tests/random" : "/billing?from=random-practice-test"}
        className="card-hover group relative flex items-center justify-between gap-4 bg-canvas border border-hairline rounded-xl p-5 sm:p-6 shadow-vercel-card overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-tr from-gradient-preview-start to-gradient-preview-end opacity-10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              Random Practice Test
              {!isPremium && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-warning-deep bg-warning-soft border border-warning-deep/15 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Premium</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-mute truncate">
              Generate a fresh, unlimited practice test with random questions — same format &amp; weightage every time.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-mute shrink-0 relative z-10 group-hover:text-ink transition" />
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {practiceTests.map((test) => (
          <PracticeTestCard
            key={test.id}
            id={test.id}
            testNumber={test.number}
            isLocked={test.isLocked}
            attemptedModules={Array.from(attemptedByTest.get(test.id) ?? [])}
          />
        ))}
      </div>
    </div>
  );
}

