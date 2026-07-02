"use client";

import React from "react";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const hasPrefix = (opt: string): boolean => {
  if (!opt || opt.length < 3) return false;
  return LETTERS.includes(opt[0]) && (opt[1] === ")" || opt[1] === ".");
};
const stripPrefix = (opt: string): string => (hasPrefix(opt) ? opt.slice(2).trim() : opt);
const displayText = (opt: string, i: number): string => (hasPrefix(opt) ? opt : `${LETTERS[i]}) ${opt}`);

/**
 * Reading: Multiple Choice — shared body for both Choose Single Answer and
 * Choose Multiple Answer. Passage on the left, question stem + options on
 * the right, matching the two-column layout used across the reading
 * question bank. No inline scoring feedback — the exam clone defers
 * scoring to Next, same as every other exam-clone body.
 */
export default function ReadingMCQExam({
  content,
  multiple,
  value,
  onChange,
}: {
  content: { passage?: string; question?: string; options?: string[] };
  multiple: boolean;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const options = content.options || [];

  const toggle = (letter: string) => {
    if (multiple) {
      onChange(value.includes(letter) ? value.filter((v) => v !== letter) : [...value, letter]);
    } else {
      onChange([letter]);
    }
  };

  return (
    <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-3 md:border-r md:border-gray-200 md:pr-8">
        <p className="text-sm font-bold text-gray-800 leading-relaxed">
          {multiple
            ? "Read the text and answer the multiple-choice question by selecting the correct responses. More than one response is correct."
            : "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct."}
        </p>
        <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[440px] overflow-y-auto pr-2">
          {content.passage}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-base font-bold text-gray-800 leading-normal pb-3 border-b border-gray-200">
          {content.question}
        </h3>
        <div className="space-y-3">
          {options.map((option, index) => {
            const letter = LETTERS[index] || String.fromCharCode(65 + index);
            const isSel = value.includes(letter);
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggle(letter)}
                className="w-full text-left flex items-start gap-3 group py-1"
              >
                <span
                  className={`w-5 h-5 shrink-0 mt-0.5 border flex items-center justify-center transition ${
                    multiple ? "rounded" : "rounded-full"
                  } ${isSel ? "bg-[#1e7a9c] border-[#1e7a9c]" : "border-gray-400 bg-white group-hover:border-gray-600"}`}
                >
                  {isSel && <span className={`bg-white ${multiple ? "w-2.5 h-2.5 rounded-[2px]" : "w-2 h-2 rounded-full"}`} />}
                </span>
                <span className="text-[15px] text-gray-700 leading-relaxed">
                  {displayText(option, index)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { stripPrefix };
