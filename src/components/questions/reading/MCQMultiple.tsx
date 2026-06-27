"use client";

import React, { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreMCQMultiple } from "@/lib/scoring/reading";

interface MCQMultipleProps {
  question: {
    id: string;
    title: string;
    content: {
      passage: string;
      question: string;
      options: string[];
      correct_answers: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

/**
 * Reading: Multiple Choice, Multiple Answers
 *
 * Read a passage, then select ALL options that correctly answer the prompt.
 * Negative marking applies: +1 per correct selection, -1 per incorrect
 * selection, floor of 0.
 *
 * The DB may store options either as letter-prefixed ("A) text") or as plain
 * strings; correct_answers may be letter keys ("A","B") or full option text.
 * We normalize so the UI always shows "A) text", "B) text", … and scoring
 * always compares option text.
 */
export default function MCQMultiple({
  question,
  onSubmitAttempt,
  isSubmitting,
}: MCQMultipleProps) {
  const { passage, question: stem, options, correct_answers } = question.content;

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Detect if options are already letter-prefixed (e.g., "A) text" or "A. text")
  // Only ")" or "." are valid separators — not a bare space, since a sentence
  // could naturally begin with "A " (e.g., "A significant change...").
  const optionHasPrefix = (opt: string): boolean => {
    if (!opt || opt.length < 3) return false;
    const first = opt[0];
    return letters.includes(first) && (opt[1] === ")" || opt[1] === ".");
  };

  // Display text always shows the letter prefix
  const getDisplayText = (option: string, index: number): string => {
    if (optionHasPrefix(option)) return option;
    return `${letters[index]}) ${option}`;
  };

  // Strip letter prefix from a stored option (for plain string comparison)
  const stripPrefix = (opt: string): string => {
    if (optionHasPrefix(opt)) return opt.slice(2).trim();
    return opt;
  };

  // Normalized option text used for stable identity in selection/scoring
  const normalizedOptions = options.map(stripPrefix);
  const normalizedCorrectAnswers = correct_answers.map(stripPrefix);

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleToggle = (optionText: string) => {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(optionText)
        ? prev.filter((item) => item !== optionText)
        : [...prev, optionText]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreMCQMultiple(selected, normalizedCorrectAnswers);

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, selected);
  };

  const handleReset = () => {
    setSelected([]);
    setSubmitted(false);
    setResult(null);
  };

  const isOptionCorrect = (normalizedText: string) =>
    normalizedCorrectAnswers.includes(normalizedText);

  return (
    <div className="space-y-6">
      {/* Passage Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
        <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider">
          Read the text below
        </span>
        <div className="text-body-sm text-ink leading-relaxed font-geist select-text pr-2 max-h-[280px] overflow-y-auto whitespace-pre-wrap">
          {passage}
        </div>
      </div>

      {/* Question Stem & Checkboxes */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Multiple Choice (Multiple Answers)
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        {/* Question Stem */}
        <h3 className="text-body-md-strong font-semibold text-ink leading-snug">
          {stem}
        </h3>

        {/* Negative marking warning banner */}
        {!submitted && (
          <div className="bg-error-soft/30 border border-error/15 rounded-md p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-error-deep mt-0.5 shrink-0" />
            <p className="text-3xs text-error-deep leading-relaxed">
              <strong>Negative marking applies:</strong> Incorrect choices deduct 1 point from your total score. Correct choices add 1 point. Minimum score is 0. Avoid guessing.
            </p>
          </div>
        )}

        {/* Options list */}
        <div className="space-y-3">
          {normalizedOptions.map((optText, index) => {
            const displayText = getDisplayText(options[index], index);
            const letter = letters[index];
            const isSel = selected.includes(optText);
            const isCorr = isOptionCorrect(optText);

            const getOptionClass = () => {
              if (submitted) {
                if (isCorr && isSel) {
                  return "border-success bg-success/5 text-success font-semibold";
                }
                if (!isCorr && isSel) {
                  return "border-error bg-error/5 text-error-deep font-semibold";
                }
                if (isCorr && !isSel) {
                  return "border-warning-deep ring-2 ring-warning ring-opacity-20 bg-canvas";
                }
                return "border-hairline opacity-50 bg-canvas-soft-2";
              }
              return isSel
                ? "border-primary bg-canvas-soft text-ink font-semibold"
                : "border-hairline hover:border-hairline-strong hover:bg-canvas-soft bg-canvas text-body";
            };

            return (
              <button
                key={`${letter}-${optText}`}
                onClick={() => handleToggle(optText)}
                disabled={submitted}
                className={`w-full text-left p-4 border rounded-md text-xs transition duration-150 flex items-center justify-between group active:scale-[0.99] shrink-0 ${
                  !submitted ? "cursor-pointer" : "cursor-default"
                } ${getOptionClass()}`}
              >
                <div className="flex items-center gap-3 pr-4">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
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
                    {isSel && (isCorr || !submitted ? (
                      <Check className="w-3 h-3 text-on-primary stroke-[3]" />
                    ) : (
                      <X className="w-3 h-3 text-on-primary stroke-[3]" />
                    ))}
                    {!isSel && submitted && isCorr && (
                      <Check className="w-3 h-3 text-success stroke-[2.5]" />
                    )}
                  </div>
                  <span className="leading-relaxed select-text">{displayText}</span>
                </div>

                {submitted && (
                  <span className="text-3xs font-mono font-semibold shrink-0 uppercase tracking-wider">
                    {isCorr && isSel && "+1 point"}
                    {!isCorr && isSel && "-1 point"}
                    {isCorr && !isSel && "Missed"}
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
              disabled={isSubmitting || selected.length === 0}
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

      {/* Model Answer (shows on submit) */}
      {submitted && (
        <ModelAnswer
          answer={`Correct options are:\n${normalizedOptions
            .map((opt, idx) => ({ opt, idx }))
            .filter(({ opt }) => isOptionCorrect(opt))
            .map(({ opt, idx }) => `• ${letters[idx]}) ${opt}`)
            .join("\n")}`}
          title="Explanation & Answer Key"
        />
      )}
    </div>
  );
}