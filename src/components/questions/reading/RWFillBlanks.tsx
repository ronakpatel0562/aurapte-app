"use client";

import React, { useState } from "react";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreRWFillInBlanks } from "@/lib/scoring/reading";

interface RWFillBlanksProps {
  question: {
    id: string;
    title: string;
    content: {
      passage_with_blanks: string;
      dropdown_choices: Record<string, string[]>;
      answers: Record<string, string>;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function RWFillBlanks({
  question,
  onSubmitAttempt,
  isSubmitting,
}: RWFillBlanksProps) {
  const { passage_with_blanks, dropdown_choices, answers: correctAnswers } = question.content;

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const parts = passage_with_blanks.split(/(\[blank_\d+\])/g);

  const handleChange = (blankId: string, val: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [blankId]: val,
    }));
    setValidationError(null);
  };

  const handleSubmit = () => {
    if (submitted) return;

    // Check if any dropdown selection is empty/pending
    const isPending = Object.keys(correctAnswers).some((key) => !userAnswers[key]);
    if (isPending) {
      setValidationError("Please select an answer for all the blanks before submitting.");
      return;
    }
    setValidationError(null);

    const scoreResult = scoreRWFillInBlanks(userAnswers, correctAnswers);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userAnswers);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setResult(null);
    setValidationError(null);
  };

  // Convert passage to highlighted readable text for model answer
  const getHighlightedModelPassage = () => {
    return (
      <>
        {parts.map((part, index) => {
          const match = part.match(/\[(blank_\d+)\]/);
          if (match) {
            const blankId = match[1];
            const correctAnswer = correctAnswers[blankId] || "";
            return (
              <strong
                key={blankId}
                className="inline bg-success/10 text-success font-semibold px-1.5 py-[2px] rounded mx-1 border border-success/20 select-text align-baseline"
              >
                {correctAnswer}
              </strong>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Interactive Board */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Fill in the Blanks (Dropdown choices)
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        {/* Inline passage with dropdown selectors */}
        <div className="text-body-md text-ink leading-loose font-geist select-text pr-2 py-2">
          {parts.map((part, index) => {
            const match = part.match(/\[(blank_\d+)\]/);
            if (match) {
              const blankId = match[1];
              const choices = dropdown_choices[blankId] || [];
              const selectedVal = userAnswers[blankId] || "";
              const correctAnswer = correctAnswers[blankId];
              const isCorrect =
                selectedVal.trim().toLowerCase() ===
                correctAnswer.trim().toLowerCase();

              const getSelectStyles = () => {
                if (submitted) {
                  return isCorrect
                    ? "border-success/30 bg-success/5 text-success font-semibold opacity-100 cursor-default"
                    : "border-error/30 bg-error/5 text-error-deep font-semibold opacity-100 cursor-default";
                }
                return selectedVal
                  ? "border-hairline-strong bg-canvas-soft text-ink"
                  : "border-hairline bg-canvas text-mute";
              };

              return (
                <span key={blankId} className="inline-block relative align-middle">
                  <select
                    value={selectedVal}
                    onChange={(e) => handleChange(blankId, e.target.value)}
                    disabled={submitted}
                    className={`h-7 mx-1 border rounded text-xs font-semibold px-2.5 pr-6 focus:outline-none cursor-pointer transition select-none appearance-none ${getSelectStyles()}`}
                  >
                    <option value="">— Select —</option>
                    {choices.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {/* Dropdown narrow arrow icon */}
                  {!submitted && (
                    <span className="absolute right-2.5 top-1.5 pointer-events-none text-mute text-[8px] font-mono">
                      ▼
                    </span>
                  )}

                  {submitted && !isCorrect && (
                    <span className="inline-flex items-center gap-0.5 ml-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-mono font-semibold border border-success/20 shadow-sm align-middle select-text">
                      ✓ {correctAnswer}
                    </span>
                  )}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>

        {/* Actions */}
        {validationError && (
          <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-md flex items-center gap-2 animate-fade-in font-medium select-none">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Answers
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

      {/* Model Answer */}
      {submitted && (
        <ModelAnswer
          answer={getHighlightedModelPassage()}
          title="Completed Text Passage"
        />
      )}
    </div>
  );
}
