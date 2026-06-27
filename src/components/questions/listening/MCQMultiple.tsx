"use client";

import React, { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreListeningMCQMultiple } from "@/lib/scoring/listening";

interface MCQMultipleProps {
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

export default function MCQMultiple({
  question,
  onSubmitAttempt,
  isSubmitting,
}: MCQMultipleProps) {
  const { audio_url, audio_transcript, question: stem, options, correct_answers } = question.content;

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleToggle = (option: string) => {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;

    const selectedKeys = selected.map((o) => o[0]);
    const scoreResult = scoreListeningMCQMultiple(selectedKeys, correct_answers);

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, selected);
  };

  const handleReset = () => {
    setSelected([]);
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer audioUrl={audio_url} transcript={audio_transcript} hasSubmitted={submitted} />

      {/* Checkboxes card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Multiple Choice (Multiple Answers)
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <h3 className="text-body-md-strong font-semibold text-ink leading-snug">
          {stem}
        </h3>

        {!submitted && (
          <div className="bg-error-soft/30 border border-error/15 rounded-md p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-error-deep mt-0.5 shrink-0" />
            <p className="text-3xs text-error-deep leading-relaxed">
              <strong>Negative marking applies:</strong> Incorrect choices deduct 1 point. Correct choices add 1 point. Minimum score is 0.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {options.map((option) => {
            const letter = option[0];
            const isSel = selected.includes(option);
            const isCorr = correct_answers.includes(letter);

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
                key={option}
                onClick={() => handleToggle(option)}
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
                    {isSel && (isCorr || !submitted ? <Check className="w-3 h-3 text-on-primary stroke-[3]" /> : <X className="w-3 h-3 text-on-primary stroke-[3]" />)}
                    {!isSel && submitted && isCorr && <Check className="w-3 h-3 text-success stroke-[2.5]" />}
                  </div>
                  <span className="leading-relaxed select-text">{option}</span>
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

      {submitted && (
        <ModelAnswer
          answer={`Correct options are:\n${options
            .filter((o) => correct_answers.includes(o[0]))
            .map((o) => `• ${o}`)
            .join("\n")}`}
          title="Explanation & Answer Key"
        />
      )}
    </div>
  );
}
