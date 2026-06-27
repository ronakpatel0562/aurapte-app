"use client";

import React, { useState } from "react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreListeningFillInBlanks } from "@/lib/scoring/listening";

interface FillBlanksProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      audio_transcript_with_blanks: string;
      answers: Record<string, string>;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function FillBlanks({
  question,
  onSubmitAttempt,
  isSubmitting,
}: FillBlanksProps) {
  const {
    audio_url,
    audio_transcript,
    audio_transcript_with_blanks,
    answers: correctAnswers,
  } = question.content;

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const parts = audio_transcript_with_blanks.split(/(\[blank_\d+\])/g);

  const handleChange = (blankId: string, val: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [blankId]: val,
    }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    const scoreResult = scoreListeningFillInBlanks(userAnswers, correctAnswers);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userAnswers);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer audioUrl={audio_url} transcript={audio_transcript} hasSubmitted={submitted} />

      {/* Interactive Board */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Fill in the Blanks (Type missing words)
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <p className="text-xs text-body leading-relaxed">
          Listen to the recording and type the missing words in each blank.
        </p>

        {/* Inline passage with text inputs */}
        <div className="text-body-md text-ink leading-loose font-geist select-text pr-2 py-2">
          {parts.map((part, index) => {
            const match = part.match(/\[(blank_\d+)\]/);
            if (match) {
              const blankId = match[1];
              const typedVal = userAnswers[blankId] || "";
              const correctAnswer = correctAnswers[blankId];
              const isCorrect =
                typedVal.trim().toLowerCase() ===
                correctAnswer.trim().toLowerCase();

              const getInputStyles = () => {
                if (submitted) {
                  return isCorrect
                    ? "border-success bg-success/5 text-success font-semibold"
                    : "border-error bg-error/5 text-error-deep font-semibold";
                }
                return typedVal
                  ? "border-hairline-strong bg-canvas-soft text-ink font-semibold"
                  : "border-hairline bg-canvas text-mute";
              };

              return (
                <span key={blankId} className="inline-block relative">
                  <input
                    type="text"
                    value={typedVal}
                    onChange={(e) => handleChange(blankId, e.target.value)}
                    disabled={submitted}
                    placeholder="Type..."
                    className={`h-7 w-28 mx-1 border rounded text-xs px-2.5 focus:outline-none transition ${getInputStyles()}`}
                  />
                  
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
          answer={audio_transcript}
          title="Full Completed Transcript"
        />
      )}
    </div>
  );
}
