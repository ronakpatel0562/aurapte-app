"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreListeningMCQSingle } from "@/lib/scoring/listening";

interface MCQSingleProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      question: string;
      options: string[];
      correct_answers: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

/**
 * Listening: Multiple Choice, Choose Single Answer
 *
 * The DB may store options either as letter-prefixed ("A) text") or as plain
 * strings, and `correct_answer` may be a single string OR `correct_answers`
 * may be an array of letter keys. We normalize so the UI always shows
 * "A) text", "B) text", … and scoring always compares option text.
 *
 * The "Explanation & Answer Key" panel that used to render after submit
 * has been removed — for MCQ questions the inline colour-coded feedback
 * (green for correct, red for your wrong choice, dimmed for the rest) is
 * enough to communicate the answer; a separate answer-key block was
 * redundant and made the page feel like an answer-leaking exam paper
 * rather than a learning exercise.
 */
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const optionHasPrefix = (opt: string): boolean => {
  if (!opt || opt.length < 3) return false;
  const first = opt[0];
  return LETTERS.includes(first) && (opt[1] === ")" || opt[1] === ".");
};

const stripPrefix = (opt: string): string =>
  optionHasPrefix(opt) ? opt.slice(2).trim() : opt;

const getDisplayText = (option: string, index: number): string =>
  optionHasPrefix(option) ? option : `${LETTERS[index]}) ${option}`;

/** Pull a correct answer out of either `correct_answer` or `correct_answers`. */
const extractCorrectAnswer = (
  content: any,
  options: string[]
): string | null => {
  const resolveLetter = (val: string): string | null => {
    const upper = val.trim().toUpperCase();
    if (upper.length === 1 && LETTERS.includes(upper)) {
      const idx = LETTERS.indexOf(upper);
      if (idx < options.length) return stripPrefix(options[idx]);
    }
    return null;
  };

  if (Array.isArray(content?.correct_answers) && content.correct_answers.length > 0) {
    const first = content.correct_answers[0];
    if (typeof first === "string") {
      return resolveLetter(first) ?? stripPrefix(first);
    }
  }
  if (typeof content?.correct_answer === "string" && content.correct_answer.length > 0) {
    return resolveLetter(content.correct_answer) ?? stripPrefix(content.correct_answer);
  }
  return null;
};

export default function MCQSingle({
  question,
  onSubmitAttempt,
  isSubmitting,
}: MCQSingleProps) {
  const { audio_url, audio_transcript, question: stem, options } = question.content;
  const rawCorrect = extractCorrectAnswer(question.content, options);
  const correctText = rawCorrect ? stripPrefix(rawCorrect) : null;

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleSelect = (option: string) => {
    if (submitted) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (submitted || !selected) return;

    const scoreResult = scoreListeningMCQSingle(
      stripPrefix(selected),
      correctText ? [correctText] : []
    );

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, selected);
  };

  const handleReset = () => {
    setSelected(null);
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer audioUrl={audio_url} transcript={audio_transcript} hasSubmitted={submitted} />

      {/* Options Panel */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Multiple Choice (Single Answer)
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <h3 className="text-body-md-strong font-semibold text-ink leading-snug">
          {stem}
        </h3>

        <div className="space-y-3">
          {options.map((option, index) => {
            const optionText = stripPrefix(option);
            const isSel = selected === option;
            const isCorr = correctText !== null && optionText === correctText;

            const getOptionClass = () => {
              if (submitted) {
                if (isCorr) {
                  return "border-success bg-success/5 text-success font-semibold";
                }
                if (isSel && !isCorr) {
                  return "border-error bg-error/5 text-error-deep font-semibold";
                }
                return "border-hairline opacity-50 bg-canvas-soft-2";
              }
              return isSel
                ? "border-primary bg-canvas-soft text-ink font-semibold"
                : "border-hairline hover:border-hairline-strong hover:bg-canvas-soft bg-canvas text-body";
            };

            return (
              <button
                key={`${index}-${optionText}`}
                onClick={() => handleSelect(option)}
                disabled={submitted}
                className={`w-full text-left p-4 border rounded-md text-xs transition duration-150 flex items-center justify-between group active:scale-[0.99] shrink-0 ${
                  !submitted ? "cursor-pointer" : "cursor-default"
                } ${getOptionClass()}`}
              >
                <div className="flex items-center gap-3 pr-4">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                      submitted
                        ? isCorr
                          ? "bg-success border-success text-on-primary"
                          : isSel
                          ? "bg-error border-error text-on-primary"
                          : "border-hairline-strong"
                        : isSel
                        ? "bg-primary border-primary text-on-primary"
                        : "border-hairline-strong group-hover:border-hairline-strong"
                    }`}
                  >
                    {isSel && (isCorr || !submitted ? <Check className="w-2.5 h-2.5 text-on-primary stroke-[3]" /> : <X className="w-2.5 h-2.5 text-on-primary stroke-[3]" />)}
                    {!isSel && submitted && isCorr && <Check className="w-2.5 h-2.5 text-success stroke-[2.5]" />}
                  </div>
                  <span className="leading-relaxed select-text">{getDisplayText(option, index)}</span>
                </div>

                {submitted && (
                  <span className="text-3xs font-mono font-semibold shrink-0 uppercase tracking-wider">
                    {isCorr && "Correct"}
                    {!isCorr && isSel && "Incorrect"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selected}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99]"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}