import React from "react";
import Link from "next/link";
import { Lock, ChevronRight, Award, Clock, FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS, planName, hasAccessToTest, isPremiumPlan, type PlanId } from "@/lib/plans";
import { allMockTests } from "@/lib/testDefinitions";
import { summarizeTestProgress, isTestComplete } from "@/lib/testProgress";
import StartExamButton from "@/components/mock-tests/StartExamButton";

export default async function MockTestsPage() {
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
  const defs = allMockTests();
  const total = defs.length;

  // Real "Completed" status per test — attempt rows are stamped with
  // test_id by MockExamRunner at submit time. A mock test is a single
  // continuous session, so completion is all-or-nothing (unlike Practice
  // Tests' per-module pills).
  const { data: attemptRows } = await supabase
    .from("user_attempts")
    .select("test_id, question_id, score, max_score, attempted_at")
    .eq("user_id", user.id)
    .in("test_id", defs.map((d) => d.id));
  const testProgress = summarizeTestProgress(attemptRows ?? []);

  // Real Mock Tests — full PTE-simulation experience. Free tier gets the
  // first PLANS.free.limits.mockTests tests, premium unlocks all of them.
  const mockTests = defs.map((def) => {
    const progress = testProgress.get(def.id);
    return {
      id: def.id,
      number: def.testNumber,
      title: def.title,
      duration: "2 hours",
      questionsCount: def.totalQuestions,
      isLocked: !hasAccessToTest(plan, "mockTests", def.testNumber),
      isCompleted: isTestComplete(progress, def.totalQuestions),
      scorePercent: progress?.scorePercent ?? 0,
    };
  });

  return (
    <div className="space-y-8 py-2 sm:py-4 select-none font-geist">
      <div className="flex items-center gap-2 text-xs font-mono text-mute uppercase">
        <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-semibold">Mock Tests</span>
      </div>

      <div className="relative bg-canvas border border-hairline rounded-xl p-6 sm:p-8 shadow-vercel-card overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-tr from-gradient-brand-start to-gradient-brand-end opacity-10 blur-2xl" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-ink" />
              <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">Full Mock Tests</h1>
            </div>
            <p className="text-sm text-mute max-w-xl leading-relaxed">
              Experience the actual PTE Core exam conditions. Complete, timed simulations with automated grading across speaking, writing, reading, and listening modules.
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
                  {PLANS.free.limits.mockTests} <span className="text-xs font-normal text-mute">/ {total} Unlocked</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {mockTests.map((test) => (
          <div
            key={test.id}
            className={`card-hover ${test.isLocked ? "card-locked" : ""} group relative bg-canvas border border-hairline rounded-xl flex flex-col overflow-hidden shadow-vercel-card`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end" />

            <div className="p-5 pt-6 space-y-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition duration-200 ${
                    test.isLocked
                      ? "bg-canvas-soft-2 text-mute"
                      : "bg-canvas-soft border border-hairline text-ink group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary"
                  }`}>
                    {test.number < 10 ? `0${test.number}` : test.number}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-semibold text-ink group-hover:text-link transition truncate">
                      {test.title}
                    </h3>
                    <span className="text-[10px] text-mute font-mono uppercase tracking-wider truncate block">
                      Complete PTE Simulation
                    </span>
                  </div>
                </div>

                {test.isLocked && (
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-warning-deep bg-warning-soft border border-warning-deep/15 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Premium</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-mute font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {test.duration}
                </span>
                <span className="w-1 h-1 rounded-full bg-hairline-strong shrink-0" />
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {test.questionsCount} Questions
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-hairline bg-canvas-soft/50 flex items-center justify-between gap-2">
              {test.isLocked ? (
                <Link
                  href="/billing"
                  className="text-xs font-semibold text-warning-deep hover:text-warning-deep/80 transition flex items-center gap-1 font-mono uppercase tracking-wider"
                >
                  <span>Upgrade to unlock</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : test.isCompleted ? (
                <>
                  <span className="text-2xs font-mono text-success font-semibold uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed · {test.scorePercent}%</span>
                  </span>
                  <StartExamButton href={`/mock-tests/${test.id}`} label="Retake Exam" />
                </>
              ) : (
                <>
                  <span className="text-2xs font-mono text-success font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span>Ready</span>
                  </span>
                  <StartExamButton href={`/mock-tests/${test.id}`} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

