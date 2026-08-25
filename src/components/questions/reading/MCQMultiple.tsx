"use client";

import React, { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
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
  isPremium?: boolean;
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
 *
 * The post-submit "Explanation & Answer Key" ModelAnswer panel has been
 * removed — the inline colour-coded feedback on each option already
 * communicates which ones were correct.
 */
export default function MCQMultiple({
  question,
  onSubmitAttempt,
  isSubmitting,
  isPremium = false,
}: MCQMultipleProps) {
  const { passage, question: stem, options, correct_answers } = question.content;

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Options arrive letter-prefixed from the mapper ("A. Some text").
  // We display them as-is; selection and scoring both use just the letter (o[0]).
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleToggle = (letter: string) => {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(letter)
        ? prev.filter((item) => item !== letter)
        : [...prev, letter]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;
    const scoreResult = scoreMCQMultiple(selected, correct_answers);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, selected);
  };

  const handleReset = () => {
    setSelected([]);
    setSubmitted(false);
    setResult(null);
  };

  const isOptionCorrect = (letter: string) => correct_answers.includes(letter);


  return (
    <div className="space-y-6">
      {/* Main Container */}
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction Paragraph */}
        <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Read the text and answer the multiple - choice question by selecting the correct responses. More than one response is correct.
        </div>

        {/* 2-Column Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-9 bg-white">
          {/* Left Column: Passage */}
          <div className="space-y-4 md:border-r md:border-gray-200 md:pr-9">
            <h4 className="text-[14px] font-bold text-gray-400 font-mono uppercase tracking-wider select-none">
              Read the text below
            </h4>
            <div className="text-[16px] text-gray-800 leading-relaxed font-sans select-text whitespace-pre-wrap max-h-[460px] overflow-y-auto pr-2">
              {passage}
            </div>
          </div>

          {/* Right Column: Question & Options */}
          <div className="space-y-8">
            <div className="flex justify-between items-center select-none pb-3 border-b border-gray-100">
              <h3 className="text-[18px] font-bold text-gray-800 leading-normal select-text">
                {stem}
              </h3>
              {submitted && result && (
                <ScoreBadge score={result.score} maxScore={result.maxScore} />
              )}
            </div>

            {!submitted && (
              <div className="bg-red-50 border border-red-100 rounded-md p-4 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-[12px] text-red-700 leading-relaxed font-sans">
                  <strong>Negative marking applies:</strong> Incorrect choices deduct 1 point. Correct choices add 1 point. Minimum score is 0.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {options.map((optText, index) => {
                const letter = optText[0] || letters[index];
                const isSel = selected.includes(letter);
                const isCorr = isOptionCorrect(letter);

                if (!submitted) {
                  return (
                    <button
                      key={`${index}-${letter}`}
                      onClick={() => handleToggle(letter)}
                      className="w-full text-left flex items-start gap-3.5 group transition duration-150 select-none py-2 cursor-pointer active:scale-[0.99]"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSel
                            ? "bg-[#1C415A] border-[#1C415A] text-white"
                            : "border-gray-400 bg-white group-hover:border-gray-600"
                        }`}
                      >
                        {isSel && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                      <span className="text-[16px] text-gray-700 font-sans leading-relaxed select-text">
                        {optText}
                      </span>
                    </button>
                  );
                } else {
                  // Submitted feedback view
                  let optionClass = "border border-gray-200 bg-white text-gray-700";
                  let checkboxClass = "border-gray-400 bg-white text-transparent";
                  let iconToRender = null;
                  let pointText = null;

                  if (isCorr && isSel) {
                    optionClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold";
                    checkboxClass = "bg-emerald-500 border-emerald-500 text-white";
                    iconToRender = <Check className="w-3.5 h-3.5 text-white stroke-[3]" />;
                    pointText = (
                      <span className="text-[11px] font-bold font-mono text-emerald-700 uppercase tracking-wider">
                        +1 point
                      </span>
                    );
                  } else if (!isCorr && isSel) {
                    optionClass = "border-red-500 bg-red-50/50 text-red-800 font-semibold";
                    checkboxClass = "bg-red-500 border-red-500 text-white";
                    iconToRender = <X className="w-3.5 h-3.5 text-white stroke-[3]" />;
                    pointText = (
                      <span className="text-[11px] font-bold font-mono text-red-700 uppercase tracking-wider">
                        -1 point
                      </span>
                    );
                  } else if (isCorr && !isSel) {
                    optionClass = "border-amber-500 bg-amber-50/30 text-amber-800 font-semibold ring-1 ring-amber-400/30";
                    checkboxClass = "border-amber-500 text-amber-700";
                    iconToRender = <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />;
                    pointText = (
                      <span className="text-[11px] font-bold font-mono text-amber-700 uppercase tracking-wider">
                        Missed
                      </span>
                    );
                  } else {
                    optionClass = "border-gray-200 opacity-60 bg-gray-50 text-gray-400";
                    checkboxClass = "border-gray-300 bg-gray-100";
                  }

                  return (
                    <div
                      key={`${index}-${letter}`}
                      className={`w-full text-left p-5 rounded-md text-xs transition duration-150 flex items-center justify-between group ${optionClass}`}
                    >
                      <div className="flex items-center gap-3.5 pr-4 select-text text-[16px]">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${checkboxClass}`}
                        >
                          {iconToRender}
                        </div>
                        <span className="leading-relaxed select-text font-sans">{optText}</span>
                      </div>
                      {pointText && <div className="shrink-0 select-none">{pointText}</div>}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
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