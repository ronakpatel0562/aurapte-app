"use client";

import React, { useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreSelectMissingWord } from "@/lib/scoring/listening";

interface SelectMissingProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      options: string[];
      correct_answers: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function SelectMissing({
  question,
  onSubmitAttempt,
  isSubmitting,
}: SelectMissingProps) {
  const { audio_url, audio_transcript, options, correct_answers } = question.content;

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleSelect = (option: string) => {
    if (submitted) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (submitted || !selected) return;

    const selectedKey = selected[0]; // "A", "B", etc.
    const scoreResult = scoreSelectMissingWord(selectedKey, correct_answers);

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

      {/* Interactive Options Board */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Select Missing Word
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        {/* Task Instruction */}
        <div className="bg-canvas-soft-2 border border-hairline rounded-md p-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 text-mute shrink-0" />
          <p className="text-xs text-body leading-relaxed">
            <strong>Task Instruction:</strong> The audio recording will end abruptly. Select the word or phrase options below that best completes the sentence.
          </p>
        </div>

        {/* Radio Options */}
        <div className="space-y-3">
          {options.map((option) => {
            const letter = option[0]; // "A", "B", etc.
            const isSel = selected === option;
            const isCorr = correct_answers.includes(letter);

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
                key={option}
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
                  <span className="leading-relaxed select-text">{option}</span>
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

      {submitted && (
        <ModelAnswer
          answer={`The correct option completes the audio as follows:\n\n"... transparent and ${options
            .find((o) => o[0] === correct_answers[0])
            ?.substring(3)}."`}
          title="Explanation & Answer Key"
        />
      )}
    </div>
  );
}
