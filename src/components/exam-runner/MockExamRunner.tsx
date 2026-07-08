"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { scoreAnswer } from "./scoreAnswer";
import MockExamEvaluation from "./evaluation/MockExamEvaluation";
import { useFullscreen } from "./useFullscreen";
import ExamChrome, { ConfirmModal, SaveExitModal, CannotSkipModal } from "./ExamChrome";
import TestOverviewScreen from "./screens/TestOverviewScreen";
import TestIntroductionScreen from "./screens/TestIntroductionScreen";
import HeadsetCheckScreen from "./screens/HeadsetCheckScreen";
import MicCheckScreen from "./screens/MicCheckScreen";
import PersonalIntroScreen from "./screens/PersonalIntroScreen";
import SectionIntroScreen from "./screens/SectionIntroScreen";
import BreakScreen from "./screens/BreakScreen";
import ExamQuestionBody from "./ExamQuestionBody";

type ModuleKey = "speaking" | "writing" | "reading" | "listening";

export interface MockModuleQuestions {
  module: ModuleKey;
  questions: RunnerQuestion[];
}

type TimelineItem =
  | { kind: "test-overview" }
  | { kind: "test-introduction" }
  | { kind: "headset-check" }
  | { kind: "mic-check" }
  | { kind: "personal-intro" }
  | { kind: "section-intro"; moduleIndex: number }
  | { kind: "question"; moduleIndex: number; questionIndex: number };

const WRITING_BUDGET_SECONDS: Record<string, number> = {
  summarize_written_text: 600,
  write_an_email: 540,
};
const SPEAKING_SECTION_BUDGET_SECONDS = 30 * 60;
const READING_SECTION_BUDGET_SECONDS = 32 * 60;
const LISTENING_BUDGET_SECONDS: Record<string, number> = {
  summarize_spoken_text: 480,
};
const BREAK_SECONDS = 10 * 60;

/**
 * Continuous, multi-module Mock Test session — chains Speaking, Writing,
 * Reading and Listening into one sitting behind a single Test Overview /
 * Test Introduction / Headset Check / Microphone Check opening, exactly
 * like the real PTE Core test driver. Single-module practice tests use
 * the simpler `ExamRunner` instead; this one is mock-test only.
 */
export default function MockExamRunner({
  testTitle,
  testId,
  modules,
  userId,
  backHref,
}: {
  testTitle: string;
  testId?: string;
  modules: MockModuleQuestions[];
  userId: string;
  backHref: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enter, exit } = useFullscreen(containerRef);

  const activeModules = useMemo(() => modules.filter((m) => m.questions.length > 0), [modules]);
  const hasSpeaking = activeModules.some((m) => m.module === "speaking");
  const hasListening = activeModules.some((m) => m.module === "listening");

  const timeline = useMemo((): TimelineItem[] => {
    const t: TimelineItem[] = [{ kind: "test-overview" }, { kind: "test-introduction" }];
    if (hasSpeaking || hasListening) t.push({ kind: "headset-check" });
    if (hasSpeaking) t.push({ kind: "mic-check" });
    if (hasSpeaking) t.push({ kind: "personal-intro" });
    activeModules.forEach((m, moduleIndex) => {
      t.push({ kind: "section-intro", moduleIndex });
      m.questions.forEach((_, questionIndex) => t.push({ kind: "question", moduleIndex, questionIndex }));
    });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModules, hasSpeaking, hasListening]);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmNext, setConfirmNext] = useState(false);
  const [confirmSaveExit, setConfirmSaveExit] = useState(false);
  const [elapsedInGroup, setElapsedInGroup] = useState(0);
  const [nextLocked, setNextLocked] = useState(false);
  const [showCannotSkip, setShowCannotSkip] = useState(false);
  const [finished, setFinished] = useState<"active" | "submitting" | "done">("active");
  // Timed reveal for the Test Overview screen — Next stays disabled for a
  // few seconds instead of auto-advancing, giving the background question
  // fetch time to finish. Separate from `nextLocked` since it has no
  // "Cannot Skip" modal.
  const [overviewNextDisabled, setOverviewNextDisabled] = useState(true);

  // Optional 10-minute break offered after Part 2 (Reading) finishes.
  const [onBreak, setOnBreak] = useState(false);
  const [breakRemaining, setBreakRemaining] = useState(BREAK_SECONDS);
  const pendingIndexRef = useRef<number | null>(null);

  useEffect(() => {
    enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onBreak) return;
    if (breakRemaining <= 0) {
      resumeFromBreak();
      return;
    }
    const id = setTimeout(() => setBreakRemaining((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBreak, breakRemaining]);

  const item = timeline[stepIndex];
  const currentModuleEntry = item.kind === "section-intro" || item.kind === "question" ? activeModules[item.moduleIndex] : null;
  const currentQuestion = item.kind === "question" ? currentModuleEntry?.questions[item.questionIndex] ?? null : null;

  const groupKey = useMemo(() => {
    if (item.kind !== "question" || !currentModuleEntry) return null;
    if (currentModuleEntry.module === "speaking") return `speaking-section-${item.moduleIndex}`;
    if (currentModuleEntry.module === "reading") return `reading-section-${item.moduleIndex}`;
    return `${currentModuleEntry.module}-${currentQuestion?.task_type}-${item.moduleIndex}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, currentModuleEntry, currentQuestion]);

  useEffect(() => {
    if (groupKey === null) return;
    setElapsedInGroup(0);
    const id = setInterval(() => setElapsedInGroup((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [groupKey]);

  const clockSeconds = useMemo(() => {
    if (item.kind !== "question" || !currentModuleEntry || !currentQuestion) return null;
    const mod = currentModuleEntry.module;
    if (mod === "speaking") return Math.max(0, SPEAKING_SECTION_BUDGET_SECONDS - elapsedInGroup);
    if (mod === "reading") return Math.max(0, READING_SECTION_BUDGET_SECONDS - elapsedInGroup);
    if (mod === "listening") {
      const budget = LISTENING_BUDGET_SECONDS[currentQuestion.task_type];
      return typeof budget === "number" ? Math.max(0, budget - elapsedInGroup) : null;
    }
    const budget = WRITING_BUDGET_SECONDS[currentQuestion.task_type] ?? 600;
    return Math.max(0, budget - elapsedInGroup);
  }, [item, currentModuleEntry, currentQuestion, elapsedInGroup]);

  const categories = useMemo(() => {
    if (!currentModuleEntry) return [];
    const order: string[] = [];
    const counts: Record<string, number> = {};
    for (const q of currentModuleEntry.questions) {
      if (!(q.task_type in counts)) order.push(q.task_type);
      counts[q.task_type] = (counts[q.task_type] || 0) + 1;
    }
    return order.map((t) => ({ label: getTaskTypeFriendlyName(t), count: counts[t] }));
  }, [currentModuleEntry]);

  const stepLabel = onBreak
    ? `${(pendingIndexRef.current ?? stepIndex) + 1} of ${timeline.length}`
    : `${stepIndex + 1} of ${timeline.length}`;

  const sectionLabel = useMemo(() => {
    if (onBreak) return "Break";
    switch (item.kind) {
      case "test-overview":
        return "";
      case "test-introduction":
        return "Test Introduction";
      case "headset-check":
        return "Headset Check";
      case "mic-check":
        return "Microphone Check";
      case "personal-intro":
        return "Personal Introduction";
      case "section-intro":
        return `${capitalize(currentModuleEntry?.module ?? "")} Section Introduction`;
      case "question":
        return currentQuestion && currentModuleEntry
          ? `${getTaskTypeFriendlyName(currentQuestion.task_type)} - ${capitalize(currentModuleEntry.module)} question-${item.questionIndex + 1}`
          : "";
      default:
        return "";
    }
  }, [item, currentModuleEntry, currentQuestion, onBreak]);

  const persistAttempt = async (question: RunnerQuestion, mod: ModuleKey, answer: string) => {
    const { score, maxScore } = scoreAnswer(question, answer);
    // Speaking is scored by the transcript-based heuristic in scoreAnswer.ts,
    // same 60% pass threshold as every other module.
    const isCorrect = maxScore > 0 && score / maxScore >= 0.6;
    try {
      const supabase = createClient();
      await supabase.from("user_attempts").insert({
        user_id: userId,
        question_id: question.id,
        user_answer: { transcript: answer },
        score,
        max_score: maxScore,
        is_correct: isCorrect,
        time_taken_seconds: null,
        test_id: testId ?? null,
        module: mod,
      });
    } catch (err) {
      console.error("Failed to persist mock exam attempt:", err);
    }
  };

  const advance = () => {
    const current = timeline[stepIndex];
    if (current.kind === "question" && currentModuleEntry && currentQuestion) {
      const answer = answers[currentQuestion.id] ?? "";
      persistAttempt(currentQuestion, currentModuleEntry.module, answer);
    }

    const nextIndex = stepIndex + 1;
    const justFinishedReading =
      current.kind === "question" &&
      currentModuleEntry?.module === "reading" &&
      current.questionIndex === (currentModuleEntry?.questions.length ?? 0) - 1;

    if (justFinishedReading && nextIndex < timeline.length) {
      pendingIndexRef.current = nextIndex;
      setBreakRemaining(BREAK_SECONDS);
      setOnBreak(true);
      return;
    }

    if (nextIndex >= timeline.length) {
      handleSubmit();
    } else {
      setStepIndex(nextIndex);
    }
  };

  const resumeFromBreak = () => {
    const next = pendingIndexRef.current;
    setOnBreak(false);
    pendingIndexRef.current = null;
    if (next !== null) setStepIndex(next);
  };

  const handleSubmit = async () => {
    setFinished("submitting");
    await exit();
    setFinished("done");
  };

  const handleNextClick = () => {
    if (onBreak) {
      resumeFromBreak();
      return;
    }
    if (nextLocked) {
      setShowCannotSkip(true);
      return;
    }
    if (item.kind === "question" || item.kind === "personal-intro") {
      setConfirmNext(true);
    } else {
      advance();
    }
  };

  const isLastStep = item.kind === "question" && stepIndex === timeline.length - 1;

  if (finished === "done") {
    return (
      <MockExamEvaluation
        testTitle={testTitle}
        modules={activeModules}
        answers={answers}
        backHref={backHref}
      />
    );
  }

  return (
    <div ref={containerRef}>
      <ExamChrome
        testTitle={testTitle}
        sectionLabel={sectionLabel}
        stepLabel={stepLabel}
        clockSeconds={onBreak ? breakRemaining : item.kind === "question" ? clockSeconds : null}
        isFullscreen={isFullscreen}
        onEnterFullscreen={enter}
        onSaveExit={() => setConfirmSaveExit(true)}
        onNext={handleNextClick}
        nextLabel={onBreak ? "Resume Now" : isLastStep ? "Submit Test" : "Next"}
        nextDisabled={item.kind === "test-overview" && overviewNextDisabled}
      >
        {onBreak ? (
          <BreakScreen remainingSeconds={breakRemaining} />
        ) : (
          <>
            {item.kind === "test-overview" && <TestOverviewScreen onLockChange={setOverviewNextDisabled} />}
            {item.kind === "test-introduction" && <TestIntroductionScreen />}
            {item.kind === "headset-check" && <HeadsetCheckScreen onLockChange={setNextLocked} />}
            {item.kind === "mic-check" && <MicCheckScreen onLockChange={setNextLocked} />}
            {item.kind === "personal-intro" && (
              <PersonalIntroScreen
                onAnswerChange={(v) => setAnswers((a) => ({ ...a, __personal_intro__: v }))}
                onLockChange={setNextLocked}
              />
            )}
            {item.kind === "section-intro" && currentModuleEntry && (
              <SectionIntroScreen
                title={`${capitalize(currentModuleEntry.module)} Section Introduction`}
                categories={categories}
              />
            )}
            {item.kind === "question" && currentQuestion && (
              <ExamQuestionBody
                key={currentQuestion.id}
                question={currentQuestion}
                answer={answers[currentQuestion.id] ?? ""}
                onAnswerChange={(v) => setAnswers((a) => ({ ...a, [currentQuestion.id]: v }))}
                elapsedSeconds={elapsedInGroup}
                onLockChange={setNextLocked}
              />
            )}
            {finished === "submitting" && <div className="text-sm text-gray-600">Submitting…</div>}
          </>
        )}
      </ExamChrome>

      {confirmNext && (
        <ConfirmModal
          message={
            isLastStep
              ? "Are you sure you want to submit this test?"
              : "Are you sure if you want to submit this answer and go to the next question?"
          }
          onYes={() => {
            setConfirmNext(false);
            advance();
          }}
          onNo={() => setConfirmNext(false)}
        />
      )}

      {showCannotSkip && <CannotSkipModal onClose={() => setShowCannotSkip(false)} />}

      {confirmSaveExit && (
        <SaveExitModal
          onConfirm={() => {
            setConfirmSaveExit(false);
            handleSubmit();
          }}
          onCancel={() => setConfirmSaveExit(false)}
        />
      )}
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
