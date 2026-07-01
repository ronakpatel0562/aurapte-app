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
  isPremium?: boolean;
}

export default function RWFillBlanks({
  question,
  onSubmitAttempt,
  isSubmitting,
  isPremium = false,
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
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction Paragraph */}
        <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.
        </div>

        {/* Workspace Area */}
        <div className="p-9 bg-white space-y-8">
          {/* Inline passage with dropdown selectors */}
          <div className="text-[17px] text-gray-800 leading-loose font-sans select-text pr-2 py-3">
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
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold opacity-100 cursor-default"
                      : "border-red-500 bg-red-50/50 text-red-800 font-semibold opacity-100 cursor-default";
                  }
                  return selectedVal
                    ? "border-gray-400 bg-gray-50 text-gray-800"
                    : "border-gray-300 bg-white text-gray-500";
                };

                return (
                  <React.Fragment key={blankId}>
                    {" "}
                    <span className="inline-block relative align-middle mx-3">
                      <select
                        value={selectedVal}
                        onChange={(e) => handleChange(blankId, e.target.value)}
                        disabled={submitted}
                        className={`h-10 border rounded text-[16px] font-semibold px-3 pr-8 focus:outline-none cursor-pointer transition select-none appearance-none ${getSelectStyles()}`}
                        style={{ fontSize: "16px" }}
                      >
                        <option value="" style={{ fontSize: "16px" }}>— Select —</option>
                        {choices.map((c) => (
                          <option key={c} value={c} style={{ fontSize: "16px" }}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {/* Dropdown narrow arrow icon */}
                      {!submitted && (
                        <span className="absolute right-3 top-3 pointer-events-none text-gray-500 text-[9px] font-mono">
                          ▼
                        </span>
                      )}

                      {submitted && !isCorrect && (
                        <span className="text-emerald-600 text-sm font-bold ml-1.5 align-middle select-text">
                          (✓ {correctAnswer})
                        </span>
                      )}
                    </span>
                    {" "}
                  </React.Fragment>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-md flex items-center gap-2 animate-fade-in font-medium select-none">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-between items-center select-none rounded-b-lg">
          <div>
            {submitted && result && (
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            )}
          </div>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "SUBMIT & CHECK"}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition"
            >
              TRY AGAIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
