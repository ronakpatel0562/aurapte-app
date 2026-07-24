"use client";

import React from "react";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";
import { decodeJson } from "../scoreAnswer";
import McqEvaluation from "./McqEvaluation";
import BlanksEvaluation from "./BlanksEvaluation";
import ReorderEvaluation from "./ReorderEvaluation";
import HighlightEvaluation from "./HighlightEvaluation";
import DictationEvaluation from "./DictationEvaluation";
import TextResponseEvaluation from "./TextResponseEvaluation";
import SpeakingEvaluation from "./SpeakingEvaluation";

/**
 * Dispatches one submitted question to its task-type evaluation body. This
 * is the review-mode mirror of ExamQuestionBody: same task_type switch, but
 * every branch renders the stored answer with correct/incorrect feedback
 * instead of an interactive input.
 */
export default function QuestionEvaluation({
  question,
  answer,
  audioUrl,
}: {
  question: RunnerQuestion;
  answer: string;
  /** Recorded-answer blob URL — speaking task types only. */
  audioUrl?: string;
}) {
  const { task_type, content } = question;

  switch (task_type) {
    case "reading_mcq_single":
      return (
        <McqEvaluation
          content={content}
          selected={decodeJson<string[]>(answer, [])}
          variant="reading"
          instruction="Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct."
        />
      );
    case "reading_mcq_multiple":
      return (
        <McqEvaluation
          content={content}
          selected={decodeJson<string[]>(answer, [])}
          variant="reading"
          instruction="Read the text and answer the multiple-choice question by selecting the correct responses. More than one response is correct."
        />
      );
    case "listening_mcq_single":
      return (
        <McqEvaluation
          content={content}
          selected={decodeJson<string[]>(answer, [])}
          variant="listening"
          instruction="Listen to the recording and answer the multiple-choice question. Only one response is correct."
        />
      );
    case "listening_mcq_multiple":
      return (
        <McqEvaluation
          content={content}
          selected={decodeJson<string[]>(answer, [])}
          variant="listening"
          instruction="Listen to the recording and answer the multiple-choice question. More than one response is correct."
        />
      );
    case "select_missing_word":
      return (
        <McqEvaluation
          content={content}
          selected={decodeJson<string[]>(answer, [])}
          variant="listening"
          instruction="At the end of the recording the last word or group of words was replaced by a beep. Select the correct option to complete the recording."
        />
      );

    case "rw_fill_in_the_blanks":
      return (
        <BlanksEvaluation
          content={content}
          user={decodeJson<Record<string, string>>(answer, {})}
          variant="text"
          instruction="Select the appropriate answer choice for each blank."
        />
      );
    case "reading_fill_in_the_blanks":
      return (
        <BlanksEvaluation
          content={content}
          user={decodeJson<Record<string, string>>(answer, {})}
          variant="text"
          instruction="Drag the correct word into each blank in the text."
        />
      );
    case "listening_fill_in_the_blanks":
      return (
        <BlanksEvaluation
          content={content}
          user={decodeJson<Record<string, string>>(answer, {})}
          variant="audio"
          instruction="Type the missing words you heard into each blank."
        />
      );

    case "reorder_paragraphs":
      return <ReorderEvaluation content={content} order={decodeJson<string[]>(answer, [])} />;

    case "highlight_incorrect_words":
      return <HighlightEvaluation content={content} selectedKeys={decodeJson<string[]>(answer, [])} />;

    case "write_from_dictation":
      return <DictationEvaluation content={content} answer={answer} />;

    case "summarize_written_text":
    case "write_an_email":
    case "summarize_spoken_text":
      return <TextResponseEvaluation taskType={task_type} content={content} answer={answer} />;

    case "read_aloud":
    case "repeat_sentence":
    case "describe_image":
    case "responding_to_situation":
    case "answer_short_question":
      return <SpeakingEvaluation taskType={task_type} content={content} answer={answer} audioUrl={audioUrl} />;

    default:
      return (
        <div className="text-sm text-gray-500">
          No evaluation available for this question type ({task_type}).
        </div>
      );
  }
}
