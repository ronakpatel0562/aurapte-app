"use client";

import React, { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";
import ScoreBadge from "@/components/questions/shared/ScoreBadge";
import { scoreAnswer, SPEAKING_TASK_TYPES } from "../scoreAnswer";
import QuestionEvaluation from "./QuestionEvaluation";
import type { MockModuleQuestions } from "../MockExamRunner";

type ResultState = "correct" | "partial" | "wrong" | "skipped" | "indicative";

interface QResult {
  score: number;
  maxScore: number;
  state: ResultState;
  answered: boolean;
}

/**
 * Post-submit evaluation for a full Mock Test — one combined score summary
 * up top, then a palette per module (Speaking/Writing/Reading/Listening)
 * so results read the same way the real PTE score report is organised.
 */
export default function MockExamEvaluation({
  testTitle,
  modules,
  answers,
  backHref,
}: {
  testTitle: string;
  modules: MockModuleQuestions[];
  answers: Record<string, string>;
  backHref: string;
}) {
  const resultsByModule = useMemo(
    () =>
      modules.map((m) =>
        m.questions.map((q): QResult => {
          const raw = answers[q.id] ?? "";
          const answered = raw.trim() !== "" && raw !== "[]" && raw !== "{}";
          const { score, maxScore } = scoreAnswer(q, raw);
          let state: ResultState;
          if (!answered) {
            state = "skipped";
          } else if (SPEAKING_TASK_TYPES.has(q.task_type)) {
            state = "indicative";
          } else if (maxScore > 0 && score >= maxScore) {
            state = "correct";
          } else if (score > 0) {
            state = "partial";
          } else {
            state = "wrong";
          }
          return { score, maxScore, state, answered };
        })
      ),
    [modules, answers]
  );

  const overall = useMemo(() => {
    let earned = 0;
    let possible = 0;
    let fullyCorrect = 0;
    let autoCount = 0;
    let recorded = 0;
    let totalQuestions = 0;
    modules.forEach((m, mi) => {
      totalQuestions += m.questions.length;
      m.questions.forEach((q, qi) => {
        const r = resultsByModule[mi][qi];
        if (SPEAKING_TASK_TYPES.has(q.task_type)) {
          if (r.state === "indicative") recorded += 1;
          return;
        }
        autoCount += 1;
        earned += r.score;
        possible += r.maxScore;
        if (r.state === "correct") fullyCorrect += 1;
      });
    });
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { earned, possible, fullyCorrect, autoCount, recorded, pct, totalQuestions };
  }, [modules, resultsByModule]);

  const [selected, setSelected] = useState<{ moduleIndex: number; questionIndex: number } | null>(null);
  const selectedQuestion =
    selected !== null ? modules[selected.moduleIndex].questions[selected.questionIndex] : null;
  const selectedResult = selected !== null ? resultsByModule[selected.moduleIndex][selected.questionIndex] : null;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Header / overall summary */}
      <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gradient-develop-start to-gradient-develop-end flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-ink">Mock Test Evaluation</h1>
            <p className="text-sm text-mute">{testTitle} — review every question below.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Stat label="Questions" value={overall.totalQuestions.toString()} />
          {overall.autoCount > 0 && (
            <>
              <Stat label="Score" value={`${overall.pct}%`} />
              <Stat label="Points" value={`${overall.earned}/${overall.possible}`} />
              <Stat label="Fully correct" value={`${overall.fullyCorrect}/${overall.autoCount}`} />
            </>
          )}
          {overall.recorded > 0 && (
            <Stat label="Speaking recorded" value={overall.recorded.toString()} />
          )}
        </div>
      </div>

      {modules.map((m, mi) => (
        <ModuleSection
          key={m.module}
          module={m.module}
          questions={m.questions}
          results={resultsByModule[mi]}
          selectedQuestionIndex={selected?.moduleIndex === mi ? selected.questionIndex : null}
          onSelect={(qi) =>
            setSelected((prev) =>
              prev && prev.moduleIndex === mi && prev.questionIndex === qi ? null : { moduleIndex: mi, questionIndex: qi }
            )
          }
        />
      ))}

      {/* Selected question evaluation */}
      {selectedQuestion && selectedResult && (
        <div className="bg-[#FAF9F6] border border-gray-300 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 bg-white">
            <div className="min-w-0">
              <div className="text-2xs font-mono uppercase tracking-wider text-gray-400">
                {capitalize(modules[selected!.moduleIndex].module)} — Question {selected!.questionIndex + 1} of{" "}
                {modules[selected!.moduleIndex].questions.length}
              </div>
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {getTaskTypeFriendlyName(selectedQuestion.task_type)}
              </h3>
            </div>
            {selectedResult.state !== "indicative" ? (
              <ScoreBadge score={selectedResult.score} maxScore={selectedResult.maxScore} />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Recorded
              </span>
            )}
          </div>
          <div className="p-6">
            <QuestionEvaluation question={selectedQuestion} answer={answers[selectedQuestion.id] ?? ""} />
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

function ModuleSection({
  module,
  questions,
  results,
  selectedQuestionIndex,
  onSelect,
}: {
  module: string;
  questions: RunnerQuestion[];
  results: QResult[];
  selectedQuestionIndex: number | null;
  onSelect: (questionIndex: number) => void;
}) {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-vercel-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">{capitalize(module)}</h2>
        <p className="text-xs text-mute">Tap a number to see its evaluation</p>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
        {questions.map((q, i) => {
          const r = results[i];
          const isActive = selectedQuestionIndex === i;
          return (
            <button
              key={q.id}
              onClick={() => onSelect(i)}
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

      <div className="mt-4 pt-3 border-t border-hairline flex flex-wrap gap-x-4 gap-y-1.5 text-2xs font-mono uppercase tracking-wider text-mute">
        <LegendDot cls="bg-emerald-500" label="Correct" />
        <LegendDot cls="bg-amber-500" label="Partial" />
        <LegendDot cls="bg-red-500" label="Incorrect" />
        <LegendDot cls="bg-slate-400" label="Skipped" />
        <LegendDot cls="bg-sky-500" label="Recorded" />
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
    indicative: "border-sky-500 text-sky-700 bg-sky-50 hover:bg-sky-100",
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
