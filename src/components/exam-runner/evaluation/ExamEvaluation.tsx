"use client";

import React, { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";
import ScoreBadge from "@/components/questions/shared/ScoreBadge";
import { scoreAnswer, SPEAKING_TASK_TYPES } from "../scoreAnswer";
import QuestionEvaluation from "./QuestionEvaluation";

type ResultState = "correct" | "partial" | "wrong" | "skipped";

interface QResult {
  score: number;
  maxScore: number;
  state: ResultState;
  answered: boolean;
}

/**
 * Post-submit evaluation screen for a single exam-clone module. The student
 * first sees just the numbered question palette (colour-coded by how they
 * did); tapping a number reveals that question's full task-type evaluation
 * below, and they can iterate through every question from there.
 */
export default function ExamEvaluation({
  testTitle,
  module,
  questions,
  answers,
  audioAnswers,
  backHref,
}: {
  testTitle: string;
  module: "speaking" | "writing" | "reading" | "listening";
  questions: RunnerQuestion[];
  answers: Record<string, string>;
  /** Recorded-answer blob URLs, keyed by question id — speaking only. */
  audioAnswers?: Record<string, string>;
  backHref: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const results = useMemo<QResult[]>(
    () =>
      questions.map((q) => {
        const raw = answers[q.id] ?? "";
        const answered = raw.trim() !== "" && raw !== "[]" && raw !== "{}";
        const { score, maxScore } = scoreAnswer(q, raw);
        let state: ResultState;
        if (!answered) {
          state = "skipped";
        } else if (maxScore > 0 && score >= maxScore) {
          state = "correct";
        } else if (score > 0) {
          state = "partial";
        } else {
          state = "wrong";
        }
        return { score, maxScore, state, answered };
      }),
    [questions, answers]
  );

  const summary = useMemo(() => {
    let earned = 0;
    let possible = 0;
    let fullyCorrect = 0;
    let autoCount = 0;
    let recorded = 0;
    results.forEach((r, i) => {
      if (SPEAKING_TASK_TYPES.has(questions[i].task_type) && r.answered) recorded += 1;
      autoCount += 1;
      earned += r.score;
      possible += r.maxScore;
      if (r.state === "correct") fullyCorrect += 1;
    });
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { earned, possible, fullyCorrect, autoCount, recorded, pct };
  }, [results, questions]);

  const selectedQuestion = selected !== null ? questions[selected] : null;
  const selectedResult = selected !== null ? results[selected] : null;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Header / overall summary */}
      <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gradient-develop-start to-gradient-develop-end flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-ink">
              {capitalize(module)} Evaluation
            </h1>
            <p className="text-sm text-mute">{testTitle} — review every question below.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Stat label="Questions" value={questions.length.toString()} />
          {summary.autoCount > 0 && (
            <>
              <Stat label="Score" value={`${summary.pct}%`} />
              <Stat label="Points" value={`${summary.earned}/${summary.possible}`} />
              <Stat label="Fully correct" value={`${summary.fullyCorrect}/${summary.autoCount}`} />
            </>
          )}
          {summary.recorded > 0 && (
            <Stat label="Speaking recorded" value={summary.recorded.toString()} />
          )}
        </div>
      </div>

      {/* Number palette */}
      <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Questions</h2>
          <p className="text-xs text-mute">Tap a number to see its evaluation</p>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {questions.map((q, i) => {
            const r = results[i];
            const isActive = selected === i;
            return (
              <button
                key={q.id}
                onClick={() => setSelected(isActive ? null : i)}
                title={getTaskTypeFriendlyName(q.task_type)}
                className={`aspect-square rounded-md text-sm font-mono font-bold border-2 transition flex items-center justify-center ${paletteStyles(
                  r.state,
                  isActive
                )}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-hairline flex flex-wrap gap-x-4 gap-y-1.5 text-2xs font-mono uppercase tracking-wider text-mute">
          <LegendDot cls="bg-emerald-500" label="Correct" />
          <LegendDot cls="bg-amber-500" label="Partial" />
          <LegendDot cls="bg-red-500" label="Incorrect" />
          <LegendDot cls="bg-slate-400" label="Skipped" />
        </div>
      </div>

      {/* Selected question evaluation */}
      {selectedQuestion && selectedResult && (
        <div className="bg-[#FAF9F6] border border-gray-300 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 bg-white">
            <div className="min-w-0">
              <div className="text-2xs font-mono uppercase tracking-wider text-gray-400">
                Question {selected! + 1} of {questions.length}
              </div>
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {getTaskTypeFriendlyName(selectedQuestion.task_type)}
              </h3>
            </div>
            <ScoreBadge score={selectedResult.score} maxScore={selectedResult.maxScore} />
          </div>
          <div className="p-6">
            <QuestionEvaluation
              question={selectedQuestion}
              answer={answers[selectedQuestion.id] ?? ""}
              audioUrl={audioAnswers?.[selectedQuestion.id]}
            />
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <a
          href={backHref}
          className="h-10 px-5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 transition flex items-center justify-center"
        >
          Back to Tests
        </a>
        <a
          href="/dashboard"
          className="h-10 px-5 rounded-md border border-hairline bg-canvas text-sm font-medium hover:bg-canvas-soft-2 transition flex items-center justify-center"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

function paletteStyles(state: ResultState, active: boolean): string {
  const base: Record<ResultState, string> = {
    correct: "border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
    partial: "border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100",
    wrong: "border-red-500 text-red-700 bg-red-50 hover:bg-red-100",
    skipped: "border-slate-300 text-slate-500 bg-slate-50 hover:bg-slate-100",
  };
  const ring = active ? " ring-2 ring-offset-1 ring-gray-800/70 scale-105" : "";
  return base[state] + ring;
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas-soft-2 border border-hairline rounded-lg p-3">
      <div className="text-2xs font-mono uppercase tracking-wider text-mute">{label}</div>
      <div className="text-lg font-semibold text-ink mt-0.5">{value}</div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
