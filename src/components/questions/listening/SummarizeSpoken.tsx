"use client";

import React, { useState } from "react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreSummarizeSpoken } from "@/lib/scoring/listening";

interface SummarizeSpokenProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      model_answer: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function SummarizeSpoken({
  question,
  onSubmitAttempt,
  isSubmitting,
}: SummarizeSpokenProps) {
  const { audio_url, audio_transcript, model_answer } = question.content;

  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getWordCount = (val: string) => {
    return val.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(text);

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreSummarizeSpoken(text);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, text);
  };

  const handleReset = () => {
    setText("");
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer audioUrl={audio_url} transcript={audio_transcript} hasSubmitted={submitted} />

      {/* Answer Board */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Summarize Spoken Text
          </span>
          {submitted && result && (
            <div className="flex items-center gap-3">
              <span className="text-2xs font-mono font-semibold text-success uppercase bg-success/5 border border-success/15 px-2.5 py-1 rounded">
                Submitted ✓
              </span>
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            </div>
          )}
        </div>

        <p className="text-xs text-body leading-relaxed">
          You will hear a short lecture. Write a summary of the lecture in 50 to 70 words. You have 10 minutes to write (untimed practice here).
        </p>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => !submitted && setText(e.target.value)}
            disabled={submitted}
            placeholder="Type your summary here..."
            className="w-full h-36 p-4 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-hairline-strong transition resize-y font-geist"
          />
          <div className="flex justify-between items-center text-3xs font-mono">
            <span
              className={`${
                wordCount >= 50 && wordCount <= 70
                  ? "text-success font-semibold"
                  : "text-mute"
              }`}
            >
              Words: {wordCount} (Target: 50-70)
            </span>
            {wordCount > 0 && (wordCount < 50 || wordCount > 70) && (
              <span className="text-warning-deep">
                Word count is outside the 50-70 word target limit.
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount === 0}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Response
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
        <ModelAnswer answer={model_answer} title="Sample Written Summary" />
      )}
    </div>
  );
}
