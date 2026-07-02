"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { LETTERS, displayOption, EvalInstruction, EvalPassage } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for every lettered single/multiple-choice task type
 * (reading & listening MCQ + Select Missing Word). Correct options turn
 * emerald, the options the student wrongly picked turn red, everything else
 * stays neutral — the same colour language as the dashboard practice
 * component's submitted state.
 */
export default function McqEvaluation({
  content,
  selected,
  instruction,
  variant,
}: {
  content: {
    passage?: string;
    audio_url?: string;
    question?: string;
    options?: string[];
    correct_answers?: string[];
  };
  selected: string[];
  instruction: string;
  variant: "reading" | "listening";
}) {
  const options = content.options || [];
  const correct = (content.correct_answers || []).map((c) => c.trim().toUpperCase());

  const optionsColumn = (
    <div className="space-y-3">
      {content.question && (
        <h3 className="text-base font-bold text-gray-800 leading-normal pb-3 mb-3 border-b border-gray-200">
          {content.question}
        </h3>
      )}
      {options.map((option, index) => {
        const letter = LETTERS[index] || String.fromCharCode(65 + index);
        const isCorrect = correct.includes(letter);
        const isSelected = selected.includes(letter);
        const multiple = correct.length > 1;

        let box = "border-gray-200 bg-white text-gray-700";
        let marker = "border-gray-300 bg-white text-transparent";
        let icon: React.ReactNode = null;
        let tag: React.ReactNode = null;

        if (isCorrect) {
          box = "border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold";
          marker = "bg-emerald-500 border-emerald-500 text-white";
          icon = <Check className="w-3.5 h-3.5 stroke-[3]" />;
          tag = (
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-emerald-700 shrink-0">
              {isSelected ? "Correct · Your pick" : "Correct answer"}
            </span>
          );
        } else if (isSelected) {
          box = "border-red-500 bg-red-50/60 text-red-900 font-semibold";
          marker = "bg-red-500 border-red-500 text-white";
          icon = <X className="w-3.5 h-3.5 stroke-[3]" />;
          tag = (
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-red-700 shrink-0">
              Your pick
            </span>
          );
        }

        return (
          <div
            key={index}
            className={`w-full p-4 rounded-md border flex items-center justify-between gap-3 ${box}`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`w-5 h-5 shrink-0 border flex items-center justify-center ${
                  multiple ? "rounded" : "rounded-full"
                } ${marker}`}
              >
                {icon}
              </span>
              <span className="text-[15px] leading-relaxed">{displayOption(option, index)}</span>
            </div>
            {tag}
          </div>
        );
      })}
    </div>
  );

  if (variant === "reading" && content.passage) {
    return (
      <div className="space-y-4">
        <EvalInstruction>{instruction}</EvalInstruction>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="md:border-r md:border-gray-200 md:pr-8">
            <EvalPassage text={content.passage} />
          </div>
          {optionsColumn}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <EvalInstruction>{instruction}</EvalInstruction>
      {variant === "listening" && <EvalAudio audioUrl={content.audio_url} />}
      {optionsColumn}
    </div>
  );
}
