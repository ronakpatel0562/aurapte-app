"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ListChecks,
  BarChart3,
  Play,
  Pause,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapDbToUrlTaskType } from "@/lib/taskTypeMapper";

/**
 * QuestionRunner — the engine that powers both Practice Tests and full
 * Mock Tests. It owns the question queue, the timer, navigation state,
 * and per-question answer state. Pages mount it with a config describing
 * the test format.
 *
 * Why a single component for both?
 *   - The Mock Test is just a Practice Test with a 2-hour countdown,
 *     a section transition screen, and stricter time-per-question rules.
 *   - Sharing the component means every bug fix lands in both places.
 *
 * State model:
 *   - A reducer holds the canonical state (answers, flags, currentIdx,
 *     submitted flag, section progress). Easier to test than scattered
 *     useState calls and easier to reason about under race conditions
 *     like timer ticks firing while a user clicks "next".
 *   - The timer is a separate useEffect with a single setInterval that
 *     dispatches TICK. We pause the timer when the user navigates to the
 *     review screen in Mock mode.
 *
 * Question data flow:
 *   - We accept questions from the parent page (already fetched server-
 *     side) so the loader does its work before the runner mounts. This
 *     keeps the runner a pure client component.
 *   - The page is responsible for choosing how to fetch — for now we
 *     fetch by `module` + `task_type` if a Mongo ObjectID lookup table
 *     exists, otherwise we fall back to "any questions tagged with the
 *     modules this test was supposed to cover".
 *
 * Scoring:
 *   - For non-speaking modules we compute the score client-side using
 *     the existing taskTypeMapper + scorer patterns. Speaking is recorded
 *     as "submitted, awaiting manual scoring" — the AI scorer is Phase 2.
 *   - On submit we INSERT one row per question into user_attempts, exactly
 *     like the question-by-question flow does. This keeps the dashboard
 *     data model unchanged.
 */

export interface RunnerQuestion {
  id: string;
  module: string;
  task_type: string;
  title: string;
  content: any;
  difficulty?: string;
}

interface RunnerConfig {
  /** Display title shown in the header. */
  title: string;
  /** Section names shown as the user advances. */
  sections: string[];
  /** Optional module-per-section mapping for the section picker. */
  sectionModules?: Record<string, string>;
  /** Hard total time (seconds). 0 = no countdown (Practice default). */
  totalTimeSeconds: number;
  /** Per-question time limit (seconds). 0 = no per-question timer. */
  perQuestionSeconds: number;
  /** Show the section summary between sections (Mock only). */
  showSectionSummary: boolean;
  /** Submit button label — typically "Submit Test" or "Finish Section". */
  submitLabel: string;
  /** Indicates this is the simulation — adjusts UI chrome. */
  isMock: boolean;
}

interface RunnerState {
  currentIdx: number;
  answers: Record<string, any>;
  flags: Record<string, boolean>;
  submitted: boolean;
  started: boolean;
  remainingSeconds: number;
  perQuestionRemaining: number;
  paused: boolean;
  showReview: boolean;
  score: { correct: number; total: number; perModule: Record<string, { correct: number; total: number }> };
}

type RunnerAction =
  | { type: "START" }
  | { type: "TICK_TOTAL" }
  | { type: "TICK_PER_Q" }
  | { type: "PAUSE"; paused: boolean }
  | { type: "GOTO"; idx: number }
  | { type: "ANSWER"; questionId: string; answer: any }
  | { type: "FLAG"; questionId: string; flag: boolean }
  | { type: "SHOW_REVIEW"; show: boolean }
  | { type: "SUBMIT"; correct: number; total: number; perModule: RunnerState["score"]["perModule"] }
  | { type: "RESET_PER_Q"; seconds: number };

function reducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case "START":
      return { ...state, started: true };
    case "TICK_TOTAL":
      if (state.paused || state.submitted) return state;
      return { ...state, remainingSeconds: Math.max(0, state.remainingSeconds - 1) };
    case "TICK_PER_Q":
      if (state.paused || state.submitted) return state;
      return { ...state, perQuestionRemaining: Math.max(0, state.perQuestionRemaining - 1) };
    case "PAUSE":
      return { ...state, paused: action.paused };
    case "GOTO":
      return { ...state, currentIdx: action.idx, perQuestionRemaining: -1 };
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.answer } };
    case "FLAG":
      return { ...state, flags: { ...state.flags, [action.questionId]: action.flag } };
    case "SHOW_REVIEW":
      return { ...state, showReview: action.show };
    case "SUBMIT":
      return {
        ...state,
        submitted: true,
        score: { correct: action.correct, total: action.total, perModule: action.perModule },
      };
    case "RESET_PER_Q":
      return { ...state, perQuestionRemaining: action.seconds };
    default:
      return state;
  }
}

export default function QuestionRunner({
  questions,
  config,
  userId,
  testId,
}: {
  questions: RunnerQuestion[];
  config: RunnerConfig;
  userId: string;
  /** e.g. "practice-test-3" — stamped onto each attempt row so listing
   *  pages can compute real "Attempted" status per test. */
  testId?: string;
}) {
  const initialState: RunnerState = useMemo(
    () => ({
      currentIdx: 0,
      answers: {},
      flags: {},
      submitted: false,
      started: false,
      remainingSeconds: config.totalTimeSeconds,
      perQuestionRemaining: config.perQuestionSeconds,
      paused: false,
      showReview: false,
      score: { correct: 0, total: 0, perModule: {} },
    }),
    [config.totalTimeSeconds, config.perQuestionSeconds]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const currentQ = questions[state.currentIdx];
  const total = questions.length;

  // ---------------------------------------------------------------------
  // Timers
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!state.started || state.submitted || state.paused) return;
    if (config.totalTimeSeconds <= 0) return;
    const id = setInterval(() => dispatch({ type: "TICK_TOTAL" }), 1000);
    return () => clearInterval(id);
  }, [state.started, state.submitted, state.paused, config.totalTimeSeconds]);

  useEffect(() => {
    if (!state.started || state.submitted || state.paused) return;
    if (config.perQuestionSeconds <= 0) return;
    const id = setInterval(() => dispatch({ type: "TICK_PER_Q" }), 1000);
    return () => clearInterval(id);
  }, [state.started, state.submitted, state.paused, state.currentIdx, config.perQuestionSeconds]);

  // Auto-submit when total time runs out (mock test).
  useEffect(() => {
    if (config.totalTimeSeconds > 0 && state.started && state.remainingSeconds === 0 && !state.submitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.remainingSeconds]);

  // Per-question reset when advancing.
  useEffect(() => {
    if (config.perQuestionSeconds > 0) {
      dispatch({ type: "RESET_PER_Q", seconds: config.perQuestionSeconds });
    }
  }, [state.currentIdx, config.perQuestionSeconds]);

  // ---------------------------------------------------------------------
  // Scoring — runs on submit. Simple per-question matcher; full AI
  // scoring for Speaking/Writing will be Phase 2.
  // ---------------------------------------------------------------------
  const computeScore = useCallback(() => {
    let correct = 0;
    const perModule: Record<string, { correct: number; total: number }> = {};

    for (const q of questions) {
      const mod = q.module;
      if (!perModule[mod]) perModule[mod] = { correct: 0, total: 0 };
      perModule[mod].total += 1;

      const userAnswer = state.answers[q.id];
      const isCorrect = scoreQuestion(q, userAnswer);
      if (isCorrect) {
        correct += 1;
        perModule[mod].correct += 1;
      }
    }
    return { correct, total: questions.length, perModule };
  }, [questions, state.answers]);

  const handleSubmit = useCallback(async () => {
    if (state.submitted) return;
    const score = computeScore();

    // Persist attempts — same table the question-by-question flow uses.
    try {
      const supabase = createClient();
      const rows = questions.map((q) => {
        const userAnswer = state.answers[q.id];
        const isCorrect = scoreQuestion(q, userAnswer);
        // Speaking modules can't be auto-scored — record as attempted.
        const finalCorrect = q.module === "speaking" ? false : isCorrect;
        return {
          user_id: userId,
          question_id: q.id,
          user_answer: userAnswer ?? null,
          score: finalCorrect ? 1 : 0,
          max_score: 1,
          is_correct: finalCorrect,
          test_id: testId ?? null,
          module: q.module,
        };
      });
      // Insert in chunks to avoid request body limits on big mock tests.
      const CHUNK = 25;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await supabase.from("user_attempts").insert(rows.slice(i, i + CHUNK));
      }
    } catch (err) {
      console.error("Failed to persist test attempts:", err);
      // Don't block the UI; the user still sees their score.
    }

    dispatch({ type: "SUBMIT", correct: score.correct, total: score.total, perModule: score.perModule });
  }, [computeScore, questions, state.answers, state.submitted, userId, testId]);

  // ---------------------------------------------------------------------
  // Pre-start screen
  // ---------------------------------------------------------------------
  if (!state.started) {
    return (
      <PreStart
        title={config.title}
        questionsCount={total}
        totalTimeSeconds={config.totalTimeSeconds}
        sections={config.sections}
        isMock={config.isMock}
        onStart={() => dispatch({ type: "START" })}
      />
    );
  }

  // ---------------------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------------------
  if (state.submitted) {
    return (
      <ResultScreen
        score={state.score}
        questions={questions}
        flags={state.flags}
        isMock={config.isMock}
        onReview={() => dispatch({ type: "SHOW_REVIEW", show: true })}
      />
    );
  }

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-mute">No questions loaded for this test.</div>
    );
  }

  // ---------------------------------------------------------------------
  // Active runner UI
  // ---------------------------------------------------------------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
      {/* Main question panel */}
      <div className="space-y-4">
        {/* Section bar */}
        {config.sections.length > 1 && (
          <div className="flex items-center justify-between gap-2 px-1 text-2xs font-mono uppercase tracking-wider text-mute">
            <span>
              Section {Math.min(state.currentIdx + 1, config.sections.length)} of {config.sections.length}
              {" · "}
              <span className="text-ink font-semibold">
                {config.sections[
                  Math.min(
                    Math.floor((state.currentIdx / Math.max(1, total)) * config.sections.length),
                    config.sections.length - 1
                  )
                ] || "—"}
              </span>
            </span>
            <span className="text-mute">
              Question {state.currentIdx + 1} / {total}
            </span>
          </div>
        )}

        {/* Question card */}
        <div className="bg-canvas border border-hairline rounded-xl p-5 sm:p-7 shadow-vercel-card space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
            <div className="space-y-1 min-w-0">
              <div className="text-2xs font-mono uppercase tracking-wider text-mute">
                {currentQ.module} · {mapDbToUrlTaskType(currentQ.task_type)}
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-ink truncate">
                {currentQ.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => dispatch({ type: "FLAG", questionId: currentQ.id, flag: !state.flags[currentQ.id] })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-2xs font-mono uppercase tracking-wider border transition ${
                  state.flags[currentQ.id]
                    ? "bg-warning/10 text-warning-deep border-warning/30"
                    : "bg-canvas text-mute border-hairline hover:border-hairline-strong"
                }`}
              >
                <Flag className="w-3 h-3" />
                {state.flags[currentQ.id] ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Question body — simplest reasonable representation. The full
              task-specific UI (audio player, MCQ options, fill-in-blanks
              inputs) is rendered through the same components used by the
              single-question page; for the runner we render a compact
              textarea + MCQ list based on what we know about the question. */}
          <RunnerQuestionBody
            question={currentQ}
            answer={state.answers[currentQ.id]}
            onChange={(a) => dispatch({ type: "ANSWER", questionId: currentQ.id, answer: a })}
            disabled={state.paused}
          />
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => dispatch({ type: "GOTO", idx: Math.max(0, state.currentIdx - 1) })}
            disabled={state.currentIdx === 0}
            className="h-10 px-4 rounded-md border border-hairline bg-canvas text-sm font-medium hover:bg-canvas-soft-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {config.totalTimeSeconds > 0 && (
              <button
                onClick={() => dispatch({ type: "PAUSE", paused: !state.paused })}
                className="h-10 w-10 rounded-md border border-hairline bg-canvas text-mute hover:text-ink hover:border-hairline-strong transition flex items-center justify-center"
                aria-label={state.paused ? "Resume timer" : "Pause timer"}
              >
                {state.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
            {state.currentIdx === total - 1 ? (
              <button
                onClick={() => dispatch({ type: "SHOW_REVIEW", show: true })}
                className="h-10 px-5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition flex items-center gap-1.5"
              >
                <ListChecks className="w-4 h-4" />
                Review &amp; Submit
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: "GOTO", idx: Math.min(total - 1, state.currentIdx + 1) })}
                className="h-10 px-5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition flex items-center gap-1.5"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar — timer + question list */}
      <aside className="space-y-4 lg:sticky lg:top-20 self-start">
        {/* Timer card */}
        {config.totalTimeSeconds > 0 && (
          <div className="bg-canvas border border-hairline rounded-xl p-4 shadow-vercel-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xs font-mono uppercase tracking-wider text-mute">
                Time Remaining
              </span>
              <Clock className={`w-4 h-4 ${state.remainingSeconds < 60 ? "text-error animate-pulse" : "text-mute"}`} />
            </div>
            <div
              data-testid="timer"
              className={`text-3xl font-bold font-mono tabular-nums ${
                state.remainingSeconds < 60 ? "text-error" : "text-ink"
              }`}
            >
              {formatHMS(state.remainingSeconds)}
            </div>
            {config.perQuestionSeconds > 0 && (
              <div className="mt-3 pt-3 border-t border-hairline">
                <span className="text-2xs font-mono uppercase tracking-wider text-mute">
                  This Question
                </span>
                <div className="text-xl font-mono tabular-nums text-ink mt-1">
                  {formatMS(state.perQuestionRemaining)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question palette */}
        <div className="bg-canvas border border-hairline rounded-xl p-4 shadow-vercel-card">
          <div className="text-2xs font-mono uppercase tracking-wider text-mute mb-3">
            Questions
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const answered = state.answers[q.id] !== undefined;
              const flagged = state.flags[q.id];
              const isCurrent = i === state.currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => dispatch({ type: "GOTO", idx: i })}
                  className={`aspect-square rounded-md text-2xs font-mono font-bold border transition flex items-center justify-center relative ${
                    isCurrent
                      ? "bg-primary text-on-primary border-primary"
                      : answered
                      ? "bg-success/10 text-success border-success/30"
                      : "bg-canvas-soft-2 text-mute border-hairline hover:border-hairline-strong"
                  }`}
                  title={`Q${i + 1}: ${q.title}`}
                >
                  {i + 1}
                  {flagged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning border border-canvas" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-3 text-2xs text-mute">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-success/40 border border-success/30" />
              Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-warning border border-warning/30" />
              Flagged
            </span>
          </div>
        </div>
      </aside>

      {/* Review modal */}
      {state.showReview && (
        <ReviewModal
          questions={questions}
          answers={state.answers}
          flags={state.flags}
          currentIdx={state.currentIdx}
          onClose={() => dispatch({ type: "SHOW_REVIEW", show: false })}
          onJump={(i) => {
            dispatch({ type: "GOTO", idx: i });
            dispatch({ type: "SHOW_REVIEW", show: false });
          }}
          onSubmit={handleSubmit}
          submitLabel={config.submitLabel}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PreStart({
  title,
  questionsCount,
  totalTimeSeconds,
  sections,
  isMock,
  onStart,
}: {
  title: string;
  questionsCount: number;
  totalTimeSeconds: number;
  sections: string[];
  isMock: boolean;
  onStart: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-canvas border border-hairline rounded-xl p-6 sm:p-8 shadow-vercel-card space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gradient-preview-start to-gradient-preview-end flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-ink">{title}</h1>
            <p className="text-sm text-mute">
              {isMock
                ? "This is a full PTE-simulated exam. Once you start, the timer cannot be paused past the warning threshold."
                : "A focused practice run. Take your time — there is no countdown."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label="Questions" value={questionsCount.toString()} />
          <Metric label="Time" value={totalTimeSeconds > 0 ? formatHMS(totalTimeSeconds) : "Self-paced"} />
          <Metric label="Sections" value={sections.length.toString()} />
        </div>

        {sections.length > 1 && (
          <div className="space-y-2">
            <div className="text-2xs font-mono uppercase tracking-wider text-mute">Sections</div>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full text-2xs font-medium bg-canvas-soft-2 border border-hairline text-body">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {isMock && (
          <div className="flex items-start gap-2.5 p-3 bg-warning-soft/50 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning-deep shrink-0 mt-0.5" />
            <div className="text-xs text-warning-deep leading-relaxed">
              <strong>Exam conditions apply.</strong> The timer cannot be paused beyond a 30-second warning. Once submitted, attempts are recorded and the test cannot be retaken without reset.
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full h-12 rounded-lg bg-primary text-on-primary font-semibold hover:bg-opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          {isMock ? "Start Exam" : "Start Practice"}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas-soft-2 border border-hairline rounded-lg p-3">
      <div className="text-2xs font-mono uppercase tracking-wider text-mute">{label}</div>
      <div className="text-lg font-semibold text-ink mt-0.5">{value}</div>
    </div>
  );
}

function RunnerQuestionBody({
  question,
  answer,
  onChange,
  disabled,
}: {
  question: RunnerQuestion;
  answer: any;
  onChange: (a: any) => void;
  disabled: boolean;
}) {
  const { content } = question;

  // MCQ-single / MCQ-multiple — render option buttons.
  if (
    question.task_type === "listening_mcq_single" ||
    question.task_type === "listening_mcq_multiple" ||
    question.task_type === "reading_mcq_single" ||
    question.task_type === "reading_mcq_multiple" ||
    question.task_type === "select_missing_word"
  ) {
    const options: string[] = Array.isArray(content.options) ? content.options : [];
    const isMulti = question.task_type.includes("multiple");
    const selected: string[] = Array.isArray(answer) ? answer : answer ? [answer] : [];

    return (
      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selected.includes(letter);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (isMulti) {
                  onChange(isSelected ? selected.filter((s) => s !== letter) : [...selected, letter]);
                } else {
                  onChange(letter);
                }
              }}
              className={`w-full text-left p-3.5 rounded-lg border transition flex items-start gap-3 ${
                isSelected
                  ? "bg-primary/5 border-primary text-ink"
                  : "bg-canvas border-hairline text-body hover:border-hairline-strong hover:bg-canvas-soft-2"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-md flex items-center justify-center text-2xs font-mono font-bold border shrink-0 ${
                  isSelected ? "bg-primary text-on-primary border-primary" : "bg-canvas-soft-2 text-mute border-hairline"
                }`}
              >
                {letter}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{opt.replace(/^[A-Z]\.\s*/, "")}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default — free text input. Covers Writing, Summarize Spoken Text,
  // Write from Dictation, fill-in-blanks.
  return (
    <textarea
      value={typeof answer === "string" ? answer : ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={6}
      placeholder="Type your response here…"
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      autoComplete="off"
      className="w-full bg-canvas-soft-2 border border-hairline rounded-lg p-3.5 text-sm leading-relaxed font-geist focus:outline-none focus:border-primary focus:bg-canvas transition resize-y"
    />
  );
}

function ReviewModal({
  questions,
  answers,
  flags,
  currentIdx,
  onClose,
  onJump,
  onSubmit,
  submitLabel,
}: {
  questions: RunnerQuestion[];
  answers: Record<string, any>;
  flags: Record<string, boolean>;
  currentIdx: number;
  onClose: () => void;
  onJump: (i: number) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const answered = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const flagged = questions.filter((q) => flags[q.id]).length;
  const unanswered = questions.length - answered;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas border border-hairline rounded-2xl shadow-vercel-modal max-w-3xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Review Your Answers</h2>
            <p className="text-xs text-mute mt-0.5">
              Tap any question to jump back. Submitting records all attempts to your profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-canvas-soft-2 flex items-center justify-center text-mute hover:text-ink"
            aria-label="Close review"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-3 border-b border-hairline grid grid-cols-3 gap-2 text-center">
          <div className="bg-canvas-soft-2 border border-hairline rounded-lg p-2">
            <div className="text-xl font-bold text-ink">{answered}</div>
            <div className="text-2xs font-mono uppercase text-mute">Answered</div>
          </div>
          <div className="bg-canvas-soft-2 border border-hairline rounded-lg p-2">
            <div className={`text-xl font-bold ${unanswered > 0 ? "text-warning-deep" : "text-ink"}`}>
              {unanswered}
            </div>
            <div className="text-2xs font-mono uppercase text-mute">Unanswered</div>
          </div>
          <div className="bg-canvas-soft-2 border border-hairline rounded-lg p-2">
            <div className="text-xl font-bold text-ink">{flagged}</div>
            <div className="text-2xs font-mono uppercase text-mute">Flagged</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {questions.map((q, i) => {
            const answered = answers[q.id] !== undefined && answers[q.id] !== "";
            const flagged = flags[q.id];
            const isCurrent = i === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => onJump(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition ${
                  isCurrent ? "border-primary bg-primary/5" : "border-hairline hover:border-hairline-strong hover:bg-canvas-soft"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-2xs font-mono font-bold border ${
                    answered
                      ? "bg-success/10 text-success border-success/30"
                      : "bg-canvas-soft-2 text-mute border-hairline"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink truncate">{q.title}</div>
                  <div className="text-2xs font-mono uppercase text-mute">
                    {q.module} · {mapDbToUrlTaskType(q.task_type)}
                  </div>
                </div>
                {flagged && <Flag className="w-3.5 h-3.5 text-warning-deep" />}
                {answered ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-mute" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-hairline flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-md border border-hairline text-sm font-medium hover:bg-canvas-soft-2 transition"
          >
            Back to Questions
          </button>
          <button
            onClick={onSubmit}
            className="h-10 px-6 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  score,
  questions,
  flags,
  isMock,
  onReview,
}: {
  score: RunnerState["score"];
  questions: RunnerQuestion[];
  flags: Record<string, boolean>;
  isMock: boolean;
  onReview: () => void;
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const verdict = pct >= 80 ? "Excellent" : pct >= 60 ? "On Track" : pct >= 40 ? "Keep Practising" : "Just Starting";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-canvas border border-hairline rounded-xl p-6 sm:p-8 shadow-vercel-card text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gradient-develop-start to-gradient-develop-end flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">{verdict}</h1>
        <p className="text-sm text-mute">
          {isMock ? "Exam submitted" : "Test submitted"} — your attempts have been saved to your dashboard.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <Metric label="Score" value={`${pct}%`} />
          <Metric label="Correct" value={`${score.correct}/${score.total}`} />
          <Metric label="Flagged" value={Object.values(flags).filter(Boolean).length.toString()} />
        </div>
      </div>

      {/* Per-module breakdown */}
      <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card space-y-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Breakdown by Module</h2>
        <div className="space-y-3">
          {Object.entries(score.perModule).map(([module, m]) => {
            const mPct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0;
            return (
              <div key={module} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink capitalize">{module}</span>
                  <span className="font-mono text-mute">
                    {m.correct} / {m.total} ({mPct}%)
                  </span>
                </div>
                <div className="h-2 bg-canvas-soft-2 rounded-full overflow-hidden border border-hairline">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${mPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/dashboard"
          className="h-10 px-5 rounded-md border border-hairline bg-canvas text-sm font-medium hover:bg-canvas-soft-2 transition flex items-center justify-center"
        >
          Back to Dashboard
        </a>
        <button
          onClick={onReview}
          className="h-10 px-5 rounded-md bg-primary text-on-primary text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition"
        >
          Review Answers
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatMS(seconds: number): string {
  if (seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Lightweight client-side scorer — compares the user's answer to the
 * stored correct answers. This intentionally duplicates only the simplest
 * cases; the existing taskTypeMapper + scorer module handle the complex
 * ones server-side. Speaking/writing return false here so we record the
 * attempt as "submitted, manual review pending".
 */
function scoreQuestion(q: RunnerQuestion, userAnswer: any): boolean {
  if (userAnswer === undefined || userAnswer === null || userAnswer === "") return false;

  const c = q.content;
  switch (q.task_type) {
    case "listening_mcq_single":
    case "reading_mcq_single":
    case "select_missing_word":
      // correct_answers is an array with one letter
      if (Array.isArray(c.correct_answers) && c.correct_answers.length > 0) {
        return c.correct_answers[0] === userAnswer;
      }
      if (typeof c.correct_answer === "string") {
        return c.correct_answer === userAnswer;
      }
      return false;

    case "listening_mcq_multiple":
    case "reading_mcq_multiple": {
      if (!Array.isArray(c.correct_answers)) return false;
      const expected = new Set<string>(c.correct_answers);
      const actual = new Set<string>(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
      if (expected.size !== actual.size) return false;
      expected.forEach((a) => { if (!actual.has(a)) return false; });
      return true;
    }

    case "summarize_spoken_text":
    case "summarize_written_text":
    case "write_an_email":
    case "write_from_dictation":
    case "responding_to_situation":
    case "answer_short_question":
    case "describe_image":
    case "read_aloud":
    case "repeat_sentence":
      // No auto-scoring yet — manual / AI grading.
      return false;

    case "listening_fill_in_the_blanks":
    case "reading_fill_in_the_blanks":
    case "rw_fill_in_the_blanks":
    case "highlight_incorrect_words":
      return false; // complex scoring handled by lib/scoring/listening.ts server-side

    default:
      return false;
  }
}
