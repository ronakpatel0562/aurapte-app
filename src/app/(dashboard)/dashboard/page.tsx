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
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();

  // Auth has to resolve first because every other call keys off user.id.
  // The remaining independent calls (profile, attempts, module-counts)
  // are fired in parallel so wall-clock time = 1 auth RTT + 1 batch RTT
  // instead of 1 + 1 + 1 + 1. `getCurrentUser` is React.cache-wrapped so
  // any other server component on this page that asks for the user gets
  // the same memoised promise.
  const user = await getCurrentUser();

  if (!user) return null;

  const userId = user.id;

  const [{ data: profile }, { data: realAttempts }, { data: moduleCounts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle(),
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

  const userName =
    profile?.full_name || user.user_metadata?.full_name || "Student";

  const attempts = realAttempts || [];
  const totalAttempts = attempts.length || 0;
  const correctAttempts = attempts.filter((a) => a.is_correct).length || 0;
  const accuracy =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Extract unique modules practiced
  const practicedModulesSet = new Set<string>();
  attempts.forEach((a) => {
    const q: any = a.questions;
    if (q?.module) {
      practicedModulesSet.add(q.module);
    }
  });
  const modulesPracticed = practicedModulesSet.size;

  // Build module counts. Prefer the RPC result; fall back to head-only
  // counts in parallel if the RPC isn't installed.
  let questionCounts = {
    speaking: 0,
    writing: 0,
    reading: 0,
    listening: 0,
  };
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
    for (const [m, c] of results) {
      questionCounts[m] = c;
    }
  }

  // Recent attempts (last 5)
  const recentAttempts = attempts?.slice(0, 5) || [];

  const statCards = [
    {
      title: "Questions Attempted",
      value: totalAttempts,
      icon: HelpCircle,
      desc: "Total practice submissions",
    },
    {
      title: "Correct Answers",
      value: correctAttempts,
      icon: CheckCircle,
      desc: "Questions scored correct",
    },
    {
      title: "Accuracy Rate",
      value: `${accuracy}%`,
      icon: TrendingUp,
      desc: "Correct vs total attempts",
    },
    {
      title: "Modules Practiced",
      value: `${modulesPracticed}/4`,
      icon: Award,
      desc: "Coverage of PTE modules",
    },
  ];

  const modules = [
    {
      name: "Speaking",
      description: "Read Aloud, Repeat Sentence, Describe Image & more.",
      count: questionCounts.speaking,
      href: "/questions/speaking/read-aloud",
      icon: Mic,
      color: "from-gradient-develop-start to-gradient-develop-end",
    },
    {
      name: "Writing",
      description: "Summarize Written Text & Write an Email.",
      count: questionCounts.writing,
      href: "/questions/writing/summarize-written-text",
      icon: PenTool,
      color: "from-gradient-preview-start to-gradient-preview-end",
    },
    {
      name: "Reading",
      description: "Fill Blanks, Paragraph Reorder & Multiple Choice.",
      count: questionCounts.reading,
      href: "/questions/reading",
      icon: BookOpenCheck,
      color: "from-gradient-ship-start to-gradient-ship-end",
    },
    {
      name: "Listening",
      description: "Dictation, Highlight Incorrect Words, Spoken Summary.",
      count: questionCounts.listening,
      href: "/questions/listening/summarize-spoken-text",
      icon: Headphones,
      color: "from-gradient-develop-start to-gradient-preview-start",
    },
  ];

  // Helper formatting for PTE type display
  const formatTaskType = (type: string) => {
    return getTaskTypeFriendlyName(type);
  };

  return (
    <div className="space-y-10 py-2 select-none">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-display-lg tracking-tight font-semibold text-ink">
          Welcome back, {userName}
        </h1>
        <p className="text-body-md text-mute">
          Here is an overview of your PTE Academic preparation progress.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-canvas border border-hairline p-6 rounded-lg shadow-vercel-card flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-mute uppercase tracking-wider">
                  {card.title}
                </span>
                <Icon className="w-5 h-5 text-mute" />
              </div>
              <div>
                <span className="text-display-md font-semibold text-ink">
                  {card.value}
                </span>
                <p className="text-2xs text-mute mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modules Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Practice Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.name}
                href={mod.href}
                className="group relative bg-canvas border border-hairline rounded-lg p-6 flex flex-col justify-between hover:border-hairline-strong transition duration-200 shadow-vercel-card overflow-hidden"
              >
                {/* Thin top color stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`} />
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-ink" />
                    <h2 className="text-body-md-strong text-ink font-semibold group-hover:text-link transition">
                      {mod.name}
                    </h2>
                  </div>
                  <p className="text-body-sm text-mute pr-6">
                    {mod.description}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <span className="text-xs font-mono bg-canvas-soft-2 border border-hairline px-2.5 py-1 rounded text-body font-medium">
                    {mod.count} {mod.count === 1 ? "question" : "questions"}
                  </span>
                  <div className="text-xs font-medium text-mute group-hover:text-ink transition flex items-center gap-1.5">
                    Start practice <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Recent Activity
        </h3>
        <div className="bg-canvas border border-hairline rounded-lg shadow-vercel-card overflow-hidden">
          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-soft border-b border-hairline text-2xs font-semibold text-mute uppercase font-mono tracking-wider">
                    <th className="py-3 px-6">PTE Question</th>
                    <th className="py-3 px-6">Module / Task</th>
                    <th className="py-3 px-6">Status / Score</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {recentAttempts.map((attempt) => {
                    const q: any = attempt.questions;
                    if (!q) return null;
                    return (
                      <tr key={attempt.id} className="hover:bg-canvas-soft transition">
                        <td className="py-4 px-6">
                          <Link
                            href={`/questions/${q.module}/${mapDbToUrlTaskType(q.task_type)}/${q.id}`}
                            className="text-body-sm-strong font-medium text-ink hover:text-link hover:underline transition truncate max-w-[240px] block"
                          >
                            {q.title || "Untitled Question"}
                          </Link>
                        </td>
                        <td className="py-4 px-6 text-xs text-body">
                          <span className="capitalize font-medium">{q.module}</span>
                          <span className="text-mute font-normal">
                            {" "}
                            • {formatTaskType(q.task_type)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-2xs font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                                attempt.is_correct
                                  ? "bg-success/10 text-success border border-success/20"
                                  : "bg-error-soft text-error-deep border border-error/20"
                              }`}
                            >
                              {attempt.is_correct ? "Passed" : "Attempted"}
                            </span>
                            <span className="text-xs font-mono text-mute">
                              {attempt.score} / {attempt.max_score}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-mute font-mono">
                          {new Date(attempt.attempted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-mute space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-mute opacity-50" />
              <p className="text-body-sm font-medium">No attempts logged yet</p>
              <p className="text-2xs">
                Select a module from the question bank to start practicing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
