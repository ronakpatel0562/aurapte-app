import React from "react";
import Link from "next/link";
import { Lock, Play, ChevronRight, Award, Clock, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS, planName, hasAccessToTest, isPremiumPlan, type PlanId } from "@/lib/plans";

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
  const total = 10;

  // Real Mock Tests — full PTE-simulation experience. 10 tests; free tier
  // gets the first 5, premium unlocks all 10.
  const mockTests = Array.from({ length: total }, (_, i) => {
    const testNum = i + 1;
    return {
      id: `mock-test-${testNum}`,
      number: testNum,
      title: `Full Mock Test #${testNum}`,
      duration: "2 hours",
      questionsCount: 75,
      isLocked: !hasAccessToTest(plan, "mockTests", testNum),
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
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-tr from-gradient-develop-start to-gradient-preview-end opacity-10 blur-2xl" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-develop-start via-gradient-preview-start to-gradient-ship-start" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-ink" />
              <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-ink">Full Mock Tests</h1>
            </div>
            <p className="text-sm text-mute max-w-xl leading-relaxed">
              Experience the actual PTE Academic exam conditions. Complete, timed simulations with automated grading across speaking, writing, reading, and listening modules.
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
            className={`card-hover ${test.isLocked ? "card-locked" : ""} group bg-canvas border border-hairline rounded-xl flex flex-col justify-between overflow-hidden h-[210px]`}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition duration-200 ${
                    test.isLocked
                      ? "bg-canvas-soft-2 text-mute border-hairline"
                      : "bg-canvas text-ink border-hairline-strong group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary shadow-sm"
                  }`}>
                    {test.number < 10 ? `0${test.number}` : test.number}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-semibold text-ink group-hover:text-link transition truncate">
                      {test.title}
                    </h3>
                    <span className="text-[10px] text-mute font-mono uppercase tracking-wider block">
                      Complete PTE Simulation
                    </span>
                  </div>
                </div>

                {test.isLocked && (
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-warning-deep bg-warning-soft border border-warning-deep/15 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Premium</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 pt-1 text-2xs text-body font-medium font-mono">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-canvas-soft border border-hairline">
                  <Clock className="w-3.5 h-3.5 text-mute" />
                  <span>{test.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-canvas-soft border border-hairline">
                  <FileText className="w-3.5 h-3.5 text-mute" />
                  <span>{test.questionsCount} Questions</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-hairline bg-canvas-soft/50 flex items-center justify-between">
              {test.isLocked ? (
                <Link
                  href="/billing"
                  className="text-xs font-semibold text-warning-deep hover:text-warning-deep/80 transition flex items-center gap-1 font-mono uppercase tracking-wider"
                >
                  <span>Upgrade to unlock</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <>
                  <span className="text-[10px] font-mono text-success font-semibold uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-success animate-pulse" />
                    <span>Ready to Start</span>
                  </span>
                  <Link
                    href={`/mock-tests/${test.id}`}
                    className="h-8 px-4 bg-primary text-on-primary hover:bg-opacity-90 font-semibold text-2xs rounded-md transition duration-150 flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Start Exam</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

