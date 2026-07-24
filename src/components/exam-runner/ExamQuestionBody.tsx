"use client";

import React, { useEffect } from "react";
import SpeakingRecorderFlow, { SpeakingStep } from "./SpeakingRecorderFlow";
import WritingTaskFlow from "./WritingTaskFlow";
import RWFillBlanksExam from "./reading/RWFillBlanksExam";
import ReadingFillBlanksExam from "./reading/ReadingFillBlanksExam";
import ReorderParagraphsExam from "./reading/ReorderParagraphsExam";
import ReadingMCQExam from "./reading/ReadingMCQExam";
import SummarizeSpokenExam from "./listening/SummarizeSpokenExam";
import ListeningFillBlanksExam from "./listening/ListeningFillBlanksExam";
import ListeningMCQExam from "./listening/ListeningMCQExam";
import HighlightWordsExam from "./listening/HighlightWordsExam";
import WriteDictationExam from "./listening/WriteDictationExam";
import { parsePrompt } from "@/lib/linguistics/parsePrompt";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";

/**
 * Renders the instruction line + content (passage/image/scenario) + the
 * timed recorder/editor for one question, dispatched by task_type. This
 * is the exam-clone equivalent of the dashboard's per-task-type
 * components, but wired for the persistent Next-driven exam shell instead
 * of an inline Submit button — see [[project_reuse_audio_component]] for
 * why the audio widget itself is a straight copy, not a rewrite.
 *
 * Reading/listening task types answer with structured data (records,
 * arrays) instead of plain text, but ExamRunner's answer store is
 * Record<string,string>. `decode`/`encode` below serialise to/from JSON so
 * every case can hand back a plain string to onAnswerChange without each
 * leaf component needing to know about the string-only contract.
 */
function decode<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
const encode = (v: unknown) => JSON.stringify(v);

const SPEAKING_TASK_TYPES = new Set([
  "read_aloud",
  "repeat_sentence",
  "describe_image",
  "responding_to_situation",
  "answer_short_question",
]);

export default function ExamQuestionBody({
  question,
  answer,
  onAnswerChange,
  elapsedSeconds = 0,
  onLockChange,
  onAudioAnswer,
}: {
  question: RunnerQuestion;
  answer: string;
  onAnswerChange: (value: string) => void;
  elapsedSeconds?: number;
  /** See [[SpeakingRecorderFlow.onLockChange]] — only speaking task types
   * drive this; every other type reports itself unlocked on mount. */
  onLockChange?: (locked: boolean) => void;
  /** Forwarded to SpeakingRecorderFlow's onAudioRecorded — reports the
   * recorded answer's blob URL so the evaluation screen can play it back. */
  onAudioAnswer?: (url: string) => void;
}) {
  const { content, task_type } = question;

  useEffect(() => {
    if (!SPEAKING_TASK_TYPES.has(task_type)) onLockChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  switch (task_type) {
    case "read_aloud": {
      const steps: SpeakingStep[] = [
        { kind: "wait", seconds: 35, message: (n) => `Recording in ${n} seconds` },
        { kind: "record", seconds: 40 },
      ];
      return (
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            Look at the text below. In 35 seconds, you must read this text aloud as naturally and clearly as
            possible. You have 40 seconds to read aloud. Read the text aloud and record your response.
          </p>
          <SpeakingRecorderFlow
            steps={steps}
            onAnswerChange={onAnswerChange}
            onLockChange={onLockChange}
            onAudioRecorded={onAudioAnswer}
          />
          <div className="border border-gray-300 rounded bg-white p-5 text-[15px] leading-relaxed text-gray-800">
            {content.passage ?? "No passage provided."}
          </div>
        </div>
      );
    }

    case "repeat_sentence": {
      const steps: SpeakingStep[] = [
        { kind: "audio", audioUrl: content.audio_url },
        { kind: "record", seconds: 15 },
      ];
      return (
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the
            sentence only once.
          </p>
          <SpeakingRecorderFlow
            steps={steps}
            onAnswerChange={onAnswerChange}
            onLockChange={onLockChange}
            onAudioRecorded={onAudioAnswer}
          />
        </div>
      );
    }

    case "describe_image": {
      const steps: SpeakingStep[] = [
        { kind: "wait", seconds: 25, message: (n) => `Recording in ${n} seconds` },
        { kind: "record", seconds: 40 },
      ];
      return (
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            Look at the graph below. In 25 seconds, please speak into the microphone and describe in detail
            what the graph is showing. You will have 40 seconds to give your response.
          </p>
          <SpeakingRecorderFlow
            steps={steps}
            onAnswerChange={onAnswerChange}
            onLockChange={onLockChange}
            onAudioRecorded={onAudioAnswer}
          />
          <div className="border border-gray-300 rounded overflow-hidden bg-white">
            {content.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.image_url}
                alt="Image to describe"
                className="w-full h-auto"
                style={{ maxHeight: 420, objectFit: "contain" }}
              />
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No image provided</div>
            )}
          </div>
        </div>
      );
    }

    case "responding_to_situation": {
      const steps: SpeakingStep[] = [
        { kind: "audio", audioUrl: content.audio_url },
        { kind: "wait", seconds: 20, message: (n) => `Think time: ${n} seconds remaining`, tone: "warning" },
        { kind: "record", seconds: 40 },
      ];
      return (
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            Listen to and read a description of a situation. You will have 20 seconds to think about your
            answer. Then you will hear a beep. You will have 40 seconds to answer the question. Please answer
            as completely as you can.
          </p>
          <div className="border border-gray-200 rounded-lg p-5 bg-white mb-4" style={{ color: "#2980b9" }}>
            <p className="text-sm leading-relaxed">{content.scenario ?? "No scenario provided."}</p>
            {content.question && <p className="text-sm leading-relaxed mt-2">{content.question}</p>}
          </div>
          <SpeakingRecorderFlow
            steps={steps}
            onAnswerChange={onAnswerChange}
            onLockChange={onLockChange}
            onAudioRecorded={onAudioAnswer}
          />
        </div>
      );
    }

    case "answer_short_question": {
      const steps: SpeakingStep[] = [
        { kind: "audio", audioUrl: content.audio_url },
        { kind: "wait", seconds: 3, message: () => "Get ready to speak…" },
        { kind: "record", seconds: 10 },
      ];
      return (
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            You will hear a question. Please give a simple and short answer. Often just one or a few words are
            enough.
          </p>
          <SpeakingRecorderFlow
            steps={steps}
            onAnswerChange={onAnswerChange}
            onLockChange={onLockChange}
            onAudioRecorded={onAudioAnswer}
          />
        </div>
      );
    }

    case "summarize_written_text":
      return (
        <WritingTaskFlow
          title="Read the passage below and summarize it using one sentence. You have 10 minutes to finish this task."
          prompt={content.passage ?? "No passage provided."}
          value={answer}
          onChange={onAnswerChange}
          placeholder="Type your response here…"
        />
      );

    case "write_an_email": {
      // The situation paragraph and bullet points can arrive as an explicit
      // `scenario`/`bullet_points` pair, or as a single raw `prompt` string
      // that mixes both — see WriteEmail.tsx (the Question Bank's own
      // renderer) for the same fallback, needed so the situation text isn't
      // silently dropped when only `prompt` was populated by the importer.
      const parsedFromPrompt = !content.scenario && content.prompt ? parsePrompt(content.prompt) : null;
      const description = content.scenario || parsedFromPrompt?.instruction || "";
      const points: string[] =
        Array.isArray(content.bullet_points) && content.bullet_points.length > 0
          ? content.bullet_points
          : parsedFromPrompt?.themes || [];
      return (
        <WritingTaskFlow
          title="Read the situation below and write an email to resolve the issue. You have 9 minutes to finish this task."
          prompt={
            <>
              {description && <p className="mb-3 whitespace-pre-wrap">{description}</p>}
              {points.length > 0 && (
                <ul className="space-y-1">
                  {points.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              )}
            </>
          }
          value={answer}
          onChange={onAnswerChange}
          placeholder="Type your email here…"
        />
      );
    }

    case "rw_fill_in_the_blanks":
      return (
        <RWFillBlanksExam
          content={content}
          value={decode(answer, {})}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "reading_fill_in_the_blanks":
      return (
        <ReadingFillBlanksExam
          content={content}
          value={decode(answer, {})}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "reorder_paragraphs":
      return (
        <ReorderParagraphsExam
          content={content}
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "reading_mcq_single":
    case "reading_mcq_multiple":
      return (
        <ReadingMCQExam
          content={content}
          multiple={task_type === "reading_mcq_multiple"}
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "summarize_spoken_text":
      return (
        <SummarizeSpokenExam
          content={content}
          value={answer}
          onChange={onAnswerChange}
          elapsedSeconds={elapsedSeconds}
          budgetSeconds={480}
        />
      );

    case "listening_fill_in_the_blanks":
      return (
        <ListeningFillBlanksExam
          content={content}
          value={decode(answer, {})}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "listening_mcq_single":
      return (
        <ListeningMCQExam
          content={content}
          multiple={false}
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
          instruction="Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct."
        />
      );

    case "listening_mcq_multiple":
      return (
        <ListeningMCQExam
          content={content}
          multiple
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
          instruction="Listen to the recording and answer the multiple-choice question by selecting the correct responses. More than one response is correct."
        />
      );

    case "select_missing_word":
      return (
        <ListeningMCQExam
          content={content}
          multiple={false}
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
          instruction="You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording."
        />
      );

    case "highlight_incorrect_words":
      return (
        <HighlightWordsExam
          content={content}
          value={decode(answer, [])}
          onChange={(v) => onAnswerChange(encode(v))}
        />
      );

    case "write_from_dictation":
      return <WriteDictationExam content={content} value={answer} onChange={onAnswerChange} />;

    default:
      return (
        <div className="text-sm text-gray-500">Question type not yet supported in the exam view: {task_type}</div>
      );
  }
}
