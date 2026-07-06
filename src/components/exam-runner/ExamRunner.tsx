"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTaskTypeFriendlyName } from "@/lib/taskTypeMapper";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { scoreAnswer } from "./scoreAnswer";
import ExamEvaluation from "./evaluation/ExamEvaluation";
import { useFullscreen } from "./useFullscreen";
import ExamChrome, { ConfirmModal, SaveExitModal, CannotSkipModal } from "./ExamChrome";
import HeadsetCheckScreen from "./screens/HeadsetCheckScreen";
import MicCheckScreen from "./screens/MicCheckScreen";
import PersonalIntroScreen from "./screens/PersonalIntroScreen";
import SectionIntroScreen from "./screens/SectionIntroScreen";
import ExamQuestionBody from "./ExamQuestionBody";

type Phase =
  | { kind: "headset-check" }
  | { kind: "mic-check" }
  | { kind: "personal-intro" }
  | { kind: "section-intro" }
  | { kind: "question"; index: number }
  | { kind: "submitting" }
  | { kind: "done" };

// Real PTE writing time budgets, shared cumulatively across every item of
// the same task type and reset when the task type changes.
const WRITING_BUDGET_SECONDS: Record<string, number> = {
  summarize_written_text: 600,
  write_an_email: 540,
};
const SPEAKING_SECTION_BUDGET_SECONDS = 30 * 60;
const READING_SECTION_BUDGET_SECONDS = 32 * 60;
// Only Summarize Spoken Text shows a visible per-item countdown (matches
// the real PTE test driver); other listening item types are audio-driven
// with no observed on-screen budget, so they get no header clock.
const LISTENING_BUDGET_SECONDS: Record<string, number> = {
  summarize_spoken_text: 480,
};

export default function ExamRunner({
  testTitle,
  testId,
  module,
  questions,
  userId,
  backHref,
}: {
  testTitle: string;
  /** e.g. "practice-test-3" — stamped onto each attempt row so listing
   *  pages can compute real "Attempted" status per test. */
  testId?: string;
  module: "speaking" | "writing" | "reading" | "listening";
  questions: RunnerQuestion[];
  userId: string;
  backHref: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enter, exit } = useFullscreen(containerRef);

  const [phase, setPhase] = useState<Phase>(
    module === "speaking" || module === "listening" ? { kind: "headset-check" } : { kind: "section-intro" }
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmNext, setConfirmNext] = useState(false);
  const [confirmSaveExit, setConfirmSaveExit] = useState(false);
  const [elapsedInGroup, setElapsedInGroup] = useState(0);
  // Blocks "Next" while a speaking prompt is still prepping/recording —
  // see SpeakingRecorderFlow's onLockChange for how this gets flipped.
  const [nextLocked, setNextLocked] = useState(false);
  const [showCannotSkip, setShowCannotSkip] = useState(false);

  useEffect(() => {
    enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const order: string[] = [];
    const counts: Record<string, number> = {};
    for (const q of questions) {
      if (!(q.task_type in counts)) order.push(q.task_type);
      counts[q.task_type] = (counts[q.task_type] || 0) + 1;
    }
    return order.map((t) => ({ label: getTaskTypeFriendlyName(t), count: counts[t] }));
  }, [questions]);

  const currentQuestion = phase.kind === "question" ? questions[phase.index] : null;

  // Section-wide (speaking) / per-task-type-group (writing) countdown clock.
  useEffect(() => {
    if (phase.kind !== "question") return;
    setElapsedInGroup(0);
    const id = setInterval(() => setElapsedInGroup((s) => s + 1), 1000);
    return () => clearInterval(id);
    // Reset whenever the task-type group changes (writing) or on every
    // question for speaking, which uses one continuous section clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind === "question" ? groupKeyFor(module, questions, phase.index) : null]);

  const clockSeconds = useMemo(() => {
    if (phase.kind !== "question" || !currentQuestion) return null;
    if (module === "speaking") {
      // One continuous budget across the whole section — elapsed is
      // reset per question above only via the groupKey, which is stable
      // for the whole speaking section, so this behaves as one clock.
      return Math.max(0, SPEAKING_SECTION_BUDGET_SECONDS - elapsedInGroup);
    }
    if (module === "reading") {
      // Reading is also one continuous section-wide clock (matches the
      // real PTE test driver — 32:00 counting down across every question).
      return Math.max(0, READING_SECTION_BUDGET_SECONDS - elapsedInGroup);
    }
    if (module === "listening") {
      const budget = LISTENING_BUDGET_SECONDS[currentQuestion.task_type];
      return typeof budget === "number" ? Math.max(0, budget - elapsedInGroup) : null;
    }
    const budget = WRITING_BUDGET_SECONDS[currentQuestion.task_type] ?? 600;
    return Math.max(0, budget - elapsedInGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, elapsedInGroup, currentQuestion, module]);

  const preScreenOrder = useMemo((): Phase["kind"][] => {
    if (module === "speaking") return ["headset-check", "mic-check", "personal-intro", "section-intro"];
    if (module === "listening") return ["headset-check", "section-intro"];
    return ["section-intro"]; // writing, reading
  }, [module]);

  const stepLabel = useMemo(() => {
    if (phase.kind === "question") return `${phase.index + 1} of ${questions.length}`;
    const idx = preScreenOrder.indexOf(phase.kind) + 1;
    return `${idx || preScreenOrder.length} of ${preScreenOrder.length}`;
  }, [phase, preScreenOrder, questions.length]);

  const sectionLabel = useMemo(() => {
    switch (phase.kind) {
      case "headset-check":
        return "Headset Check";
      case "mic-check":
        return "Microphone Check";
      case "personal-intro":
        return "Personal Introduction";
      case "section-intro":
        return `${capitalize(module)} Section Introduction`;
      case "question":
        return currentQuestion ? `${getTaskTypeFriendlyName(currentQuestion.task_type)} - ${capitalize(module)} question-${phase.index + 1}` : "";
      default:
        return "";
    }
  }, [phase, module, currentQuestion]);

  const persistAttempt = async (question: RunnerQuestion, answer: string) => {
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
        module,
      });
    } catch (err) {
      console.error("Failed to persist exam attempt:", err);
    }
  };

  const goToNextPhase = () => {
    switch (phase.kind) {
      case "headset-check":
        return setPhase(module === "speaking" ? { kind: "mic-check" } : { kind: "section-intro" });
      case "mic-check":
        return setPhase({ kind: "personal-intro" });
      case "personal-intro":
        return setPhase({ kind: "section-intro" });
      case "section-intro":
        return questions.length > 0 ? setPhase({ kind: "question", index: 0 }) : handleSubmit();
      case "question": {
        const q = questions[(phase as { kind: "question"; index: number }).index];
        const answer = answers[q.id] ?? "";
        persistAttempt(q, answer);
        const nextIndex = (phase as { kind: "question"; index: number }).index + 1;
        if (nextIndex < questions.length) {
          return setPhase({ kind: "question", index: nextIndex });
        }
        return handleSubmit();
      }
      default:
        return;
    }
  };

  const handleSubmit = async () => {
    setPhase({ kind: "submitting" });
    await exit();
    setPhase({ kind: "done" });
  };

  const handleNextClick = () => {
    if (nextLocked) {
      setShowCannotSkip(true);
      return;
    }
    if (phase.kind === "question" || phase.kind === "personal-intro") {
      setConfirmNext(true);
    } else {
      goToNextPhase();
    }
  };

  const isLastQuestion = phase.kind === "question" && phase.index === questions.length - 1;

  if (phase.kind === "done") {
    return (
      <ExamEvaluation
        testTitle={testTitle}
        module={module}
        questions={questions}
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
        clockSeconds={phase.kind === "question" ? clockSeconds : null}
        isFullscreen={isFullscreen}
        onEnterFullscreen={enter}
        onSaveExit={() => setConfirmSaveExit(true)}
        onNext={handleNextClick}
        nextLabel={isLastQuestion ? "Submit Test" : "Next"}
      >
        {phase.kind === "headset-check" && <HeadsetCheckScreen onLockChange={setNextLocked} />}
        {phase.kind === "mic-check" && <MicCheckScreen onLockChange={setNextLocked} />}
        {phase.kind === "personal-intro" && (
          <PersonalIntroScreen
            onAnswerChange={(v) => setAnswers((a) => ({ ...a, __personal_intro__: v }))}
            onLockChange={setNextLocked}
          />
        )}
        {phase.kind === "section-intro" && (
          <SectionIntroScreen title={`${capitalize(module)} Section Introduction`} categories={categories} />
        )}
        {phase.kind === "question" && currentQuestion && (
          <ExamQuestionBody
            key={currentQuestion.id}
            question={currentQuestion}
            answer={answers[currentQuestion.id] ?? ""}
            onAnswerChange={(v) => setAnswers((a) => ({ ...a, [currentQuestion.id]: v }))}
            elapsedSeconds={elapsedInGroup}
            onLockChange={setNextLocked}
          />
        )}
        {phase.kind === "submitting" && <div className="text-sm text-gray-600">Submitting…</div>}
      </ExamChrome>

      {confirmNext && (
        <ConfirmModal
          message={
            isLastQuestion
              ? "Are you sure you want to submit this test?"
              : "Are you sure if you want to submit this answer and go to the next question?"
          }
          onYes={() => {
            setConfirmNext(false);
            goToNextPhase();
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

function groupKeyFor(
  module: "speaking" | "writing" | "reading" | "listening",
  questions: RunnerQuestion[],
  index: number
): string {
  // Speaking and Reading run one continuous clock for the whole section;
  // Writing and Listening reset per task-type group (Listening because
  // only Summarize Spoken Text has a per-item budget — see
  // LISTENING_BUDGET_SECONDS above).
  if (module === "speaking") return "speaking-section";
  if (module === "reading") return "reading-section";
  return questions[index]?.task_type ?? `${module}-section`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
