"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Mic, PenTool, BookOpenCheck, Headphones, AlertTriangle, Loader2 } from "lucide-react";
import ExamRunner from "@/components/exam-runner/ExamRunner";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { generateRandomPracticeModule } from "@/app/(dashboard)/practice-tests/random/actions";
import type { Module } from "@/lib/practiceTestFormat";

interface RandomPracticeTestLauncherProps {
  userId: string;
}

interface ModuleRow {
  key: Module;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTint: string;
}

const MODULES: ModuleRow[] = [
  { key: "speaking", label: "Speaking", icon: Mic, iconTint: "bg-error/10 text-error-deep" },
  { key: "writing", label: "Writing", icon: PenTool, iconTint: "bg-link/10 text-link-deep" },
  { key: "reading", label: "Reading", icon: BookOpenCheck, iconTint: "bg-warning/10 text-warning-deep" },
  { key: "listening", label: "Listening", icon: Headphones, iconTint: "bg-cyan/15 text-cyan-deep" },
];

export default function RandomPracticeTestLauncher({ userId }: RandomPracticeTestLauncherProps) {
  const [session, setSession] = useState<{ module: Module; questions: RunnerQuestion[]; testId: string } | null>(null);
  const [loadingModule, setLoadingModule] = useState<Module | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (module: Module) => {
    setLoadingModule(module);
    setError(null);
    const result = await generateRandomPracticeModule(module);
    setLoadingModule(null);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setSession({ module, questions: result.questions, testId: result.testId });
  };

  // Once a module is generated, hand off entirely to the same fullscreen
  // exam-clone runner the fixed practice tests use — no dashboard chrome
  // wrapped around it, matching practice-tests/[testId]?module=X exactly.
  if (session) {
    return (
      <ExamRunner
        testTitle="Random Practice Test"
        testId={session.testId}
        module={session.module}
        questions={session.questions}
        userId={userId}
        backHref="/practice-tests/random"
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
        <span className="text-body font-semibold truncate">Random</span>
      </div>

      <div className="min-h-[65vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl overflow-hidden shadow-vercel-card">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h2 className="text-sm font-semibold text-ink">Random Practice Test</h2>
                <p className="text-2xs text-mute leading-relaxed">
                  Pick a module — questions are freshly randomised each time, nothing is saved.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-error-deep bg-error/5 border border-error/15 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const isLoading = loadingModule === m.key;
                const disabled = loadingModule !== null;
                return (
                  <button
                    key={m.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleGenerate(m.key)}
                    className="flex items-center gap-2.5 rounded-lg border border-hairline bg-canvas-soft/40 px-2.5 py-2 transition hover:bg-canvas-soft hover:border-hairline-strong disabled:opacity-60 disabled:cursor-not-allowed text-left"
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.iconTint}`}>
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-2xs font-semibold text-ink truncate">{m.label}</span>
                      <span className="block text-[9px] font-mono uppercase tracking-wide text-mute truncate">
                        {isLoading ? "Generating…" : "Start"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
