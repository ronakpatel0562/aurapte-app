"use client";

import React, { useState } from "react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreWriteFromDictation } from "@/lib/scoring/listening";

interface WriteDictationProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      sentence: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function WriteDictation({
  question,
  onSubmitAttempt,
  isSubmitting,
}: WriteDictationProps) {
  const { audio_url, sentence } = question.content;

  const [typedText, setTypedText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const clean = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Highlight analysis
  const analyzedUserWords = React.useMemo(() => {
    if (!submitted) return [];
    
    const userWords = typedText.split(/\s+/).filter(Boolean);
    const correctWords = clean(sentence).split(" ").filter(Boolean);

    // Keep correct words copy to check availability and handle counts
    const correctPool = [...correctWords];

    return userWords.map((word) => {
      const cleaned = clean(word);
      const idx = correctPool.indexOf(cleaned);
      const isMatch = idx !== -1;
      
      if (isMatch) {
        // Remove word from pool to prevent multiple hits
        correctPool.splice(idx, 1);
      }

      return {
        word,
        isCorrect: isMatch,
      };
    });
  }, [submitted, typedText, sentence]);

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreWriteFromDictation(typedText, sentence);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, typedText);
  };

  const handleReset = () => {
    setTypedText("");
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Audio Player (plays the dictation sentence) */}
      <AudioPlayer audioUrl={audio_url} transcript={sentence} hasSubmitted={submitted} />

      {/* Answer Input Area */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Write from Dictation
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <p className="text-xs text-body leading-relaxed">
          You will hear a short sentence. Type the sentence exactly as you hear it in the field below. Check your spelling.
        </p>

        {/* Input Field */}
        <div className="space-y-3">
          <label
            htmlFor="dictation-input"
            className="block text-3xs font-semibold text-mute font-mono uppercase tracking-wider"
          >
            Type the sentence you heard
          </label>
          <input
            id="dictation-input"
            type="text"
            value={typedText}
            onChange={(e) => !submitted && setTypedText(e.target.value)}
            disabled={submitted}
            autoComplete="off"
            placeholder="Start typing..."
            className="w-full h-11 px-4 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-hairline-strong transition font-geist"
          />
        </div>

        {/* Word-by-word highlights showing on submit */}
        {submitted && (
          <div className="space-y-3 p-4 border border-hairline rounded-md bg-canvas-soft-2 font-geist">
            <span className="text-3xs font-mono font-semibold text-mute uppercase tracking-wider block">
              Typed Sentence Highlights
            </span>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-sm select-text">
              {analyzedUserWords.length > 0 ? (
                analyzedUserWords.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded font-medium ${
                      item.isCorrect
                        ? "bg-success/15 text-success border border-success/10"
                        : "bg-error-soft text-error-deep border border-error/10"
                    }`}
                  >
                    {item.word}
                  </span>
                ))
              ) : (
                <span className="text-mute italic text-xs">Nothing typed.</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || typedText.trim() === ""}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Sentence
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
        <ModelAnswer answer={sentence} title="Correct Sentence Key" />
      )}
    </div>
  );
}
