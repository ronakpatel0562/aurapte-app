"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreMCQSingle } from "@/lib/scoring/reading";

interface MCQSingleProps {
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
 * Reading: Multiple Choice, Choose Single Answer
 *
 * Read a passage, then select the ONE option that correctly answers the prompt.
 * All-or-nothing scoring (1 or 0).
 *
 * The DB may store options either as letter-prefixed ("A) text") or as plain
 * strings, and `correct_answer` may be a single string OR `correct_answers`
 * may be an array of letter keys. We normalize so the UI always shows
 * "A) text", "B) text", … and scoring always compares option text.
 *
 * The post-submit "Explanation & Answer Key" ModelAnswer panel has been
 * removed — the inline colour-coded feedback on each option already
 * tells the student which option was correct.
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
  const { passage, question: stem, options } = question.content;
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
    const scoreResult = scoreMCQSingle(stripPrefix(selected), correctText ? [correctText] : []);
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
      {/* Main Container */}
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction Paragraph */}
        <div className="px-6 py-5 bg-[#FAF9F6] text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.
        </div>

        {/* 2-Column Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white">
          {/* Left Column: Passage */}
          <div className="space-y-3 md:border-r md:border-gray-200 md:pr-8">
            <h4 className="text-[13px] font-bold text-gray-400 font-mono uppercase tracking-wider select-none">
              Read the text below
            </h4>
            <div className="text-[14px] text-gray-800 leading-relaxed font-sans select-text max-h-[400px] overflow-y-auto pr-2">
              {passage}
            </div>
          </div>

          {/* Right Column: Question & Options */}
          <div className="space-y-6">
            <div className="flex justify-between items-center select-none pb-2 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-800 leading-snug select-text">
                {stem}
              </h3>
              {submitted && result && (
                <ScoreBadge score={result.score} maxScore={result.maxScore} />
              )}
            </div>

            <div className="space-y-3">
              {options.map((option, index) => {
                const optionText = stripPrefix(option);
                const isSel = selected === option;
                const isCorr = correctText !== null && optionText === correctText;

                if (!submitted) {
                  return (
                    <button
                      key={`${index}-${optionText}`}
                      onClick={() => handleSelect(option)}
                      className="w-full text-left flex items-start gap-3 group transition duration-150 select-none py-1.5 cursor-pointer active:scale-[0.99]"
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSel
                            ? "bg-[#1C415A] border-[#1C415A] text-white"
                            : "border-gray-400 bg-white group-hover:border-gray-600"
                        }`}
                      >
                        {isSel && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                      <span className="text-[14px] text-gray-700 font-sans leading-relaxed select-text">
                        {getDisplayText(option, index)}
                      </span>
                    </button>
                  );
                } else {
                  // Submitted feedback view (colored container)
                  let optionClass = "border border-gray-200 bg-white text-gray-700";
                  let radioClass = "border-gray-400 bg-white text-transparent";
                  let iconToRender = null;
                  let pointText = null;

                  if (isCorr) {
                    optionClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold";
                    radioClass = "bg-emerald-500 border-emerald-500 text-white";
                    iconToRender = <Check className="w-3.5 h-3.5 text-white stroke-[3]" />;
                    pointText = (
                      <span className="text-[11px] font-bold font-mono text-emerald-700 uppercase tracking-wider">
                        Correct
                      </span>
                    );
                  } else if (isSel && !isCorr) {
                    optionClass = "border-red-500 bg-red-50/50 text-red-800 font-semibold";
                    radioClass = "bg-red-500 border-red-500 text-white";
                    iconToRender = <X className="w-3.5 h-3.5 text-white stroke-[3]" />;
                    pointText = (
                      <span className="text-[11px] font-bold font-mono text-red-700 uppercase tracking-wider">
                        Incorrect
                      </span>
                    );
                  } else {
                    optionClass = "border-gray-200 opacity-60 bg-gray-50 text-gray-400";
                    radioClass = "border-gray-300 bg-gray-100";
                  }

                  return (
                    <div
                      key={`${index}-${optionText}`}
                      className={`w-full text-left p-4 rounded-md text-xs transition duration-150 flex items-center justify-between group ${optionClass}`}
                    >
                      <div className="flex items-center gap-3 pr-4 select-text text-[14px]">
                        <div
                          className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 transition ${radioClass}`}
                        >
                          {iconToRender}
                        </div>
                        <span className="leading-relaxed select-text font-sans">{getDisplayText(option, index)}</span>
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
              disabled={isSubmitting || !selected}
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