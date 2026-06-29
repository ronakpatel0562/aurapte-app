import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapDbToUrlTaskType, getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";
import { getCurrentUser } from "@/lib/supabase/auth-cache";
import {
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { PLANS, planName, isPremiumPlan, type PlanId } from "@/lib/plans";

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

  const [{ data: realAttempts }, { data: moduleCounts }] = await Promise.all([
    supabase
      .from("user_attempts")
      .select(`
        id,
        score,
        max_score,
        is_correct,
        attempted_at,
        question_id,
        questions (
          id,
          module,
          task_type,
          title
        )
      `)
      .eq("user_id", userId)
      .order("attempted_at", { ascending: false }),
    supabase.rpc("count_questions_by_module"),
  ]);

  const attempts = realAttempts || [];
  const totalAttempts = attempts.length || 0;
  const correctAttempts = attempts.filter((a) => a.is_correct).length || 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Modules practiced — distinct count.
  const practicedModulesSet = new Set<string>();
  attempts.forEach((a: any) => {
    const q = a.questions;
    if (q?.module) practicedModulesSet.add(q.module);
  });
  const modulesPracticed = practicedModulesSet.size;

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
          .eq("is_active", true);
        return [m, count || 0] as const;
      })
    );
    for (const [m, c] of results) questionCounts[m] = c;
  }

  const recentAttempts = attempts.slice(0, 10);

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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gradient-preview-start via-gradient-ship-start to-gradient-develop-start" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gradient-preview-start to-gradient-preview-end flex items-center justify-center shadow-md shrink-0">
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

      {/* Stats — single row on desktop, 2x2 on tablet, single column on phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Questions Attempted"
          value={totalAttempts}
          desc="Total practice submissions"
          icon={<HelpCircle className="w-4 h-4 text-mute" />}
        />
        <StatCard
          title="Correct Answers"
          value={correctAttempts}
          desc={`Out of ${totalAttempts} attempts`}
          icon={<CheckCircle className="w-4 h-4 text-mute" />}
        />
        <StatCard
          title="Accuracy Rate"
          value={`${accuracy}%`}
          desc="Correct vs total attempts"
          icon={<TrendingUp className="w-4 h-4 text-mute" />}
          trend={accuracy >= 70 ? { value: "On track", positive: true } : undefined}
        />
        <StatCard
          title="Modules Practiced"
          value={`${modulesPracticed}/4`}
          desc="Coverage of PTE modules"
          icon={<Award className="w-4 h-4 text-mute" />}
        />
      </div>

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

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Recent Activity
        </h3>
        <RecentActivity attempts={recentAttempts as any} />
      </div>
    </div>
  );
}
