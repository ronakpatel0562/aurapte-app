"use client";

import React, { useEffect, useState } from "react";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import HighlightedFeedback from "./HighlightedFeedback";
import { scoreSummarizeWrittenText } from "@/lib/scoring/writing";
import {
  analyzeLinguistics,
  LinguisticAnalysis,
} from "@/lib/linguistics/analyze";

interface SummarizeTextProps {
  question: {
    id: string;
    title: string;
    content: {
      passage: string;
      model_answer: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function SummarizeText({
  question,
  onSubmitAttempt,
  isSubmitting,
}: SummarizeTextProps) {
  const { passage, model_answer } = question.content;

  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<
    typeof scoreSummarizeWrittenText
  > | null>(null);
  const [analysis, setAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // After submission, lazy-load nspell + dictionary-en and analyse the user's
  // text for spelling, capitalization, duplication, and punctuation issues.
  useEffect(() => {
    if (!submitted) return;
    let cancelled = false;
    setAnalysisLoading(true);
    analyzeLinguistics(text)
      .then((res) => {
        if (!cancelled) setAnalysis(res);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submitted, text]);

  const getWordCount = (val: string) => {
    return val.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(text);

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreSummarizeWrittenText(text);
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
      {/* Passage Area */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
        <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider">
          Read the text below
        </span>
        <div className="text-body-sm text-ink leading-relaxed font-geist select-text pr-2 max-h-[300px] overflow-y-auto">
          {passage}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Summarize Written Text
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
          Read the passage above and write a one-sentence summary of the passage. Your summary must be between 5 and 75 words. You have 10 minutes to write (untimed practice here).
        </p>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => !submitted && setText(e.target.value)}
            disabled={submitted}
            placeholder="Type your one-sentence summary here..."
            className="w-full h-32 p-4 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-hairline-strong transition resize-y font-geist"
          />
          <div className="flex justify-between items-center text-3xs font-mono">
            <span
              className={`${
                wordCount >= 5 && wordCount <= 75
                  ? "text-success font-semibold"
                  : "text-mute"
              }`}
            >
              Words: {wordCount} (Target: 5-75)
            </span>
            {wordCount > 0 && (wordCount < 5 || wordCount > 75) && (
              <span className="text-warning-deep">
                Word count must be between 5 and 75 words.
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

      {/* Spell / grammar feedback */}
      {submitted && (
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-hairline">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Your Response — Highlighted
            </span>
            <span className="text-2xs font-mono text-mute uppercase tracking-wider">
              {analysis
                ? `${analysis.issues.length} issue${
                    analysis.issues.length === 1 ? "" : "s"
                  }`
                : ""}
            </span>
          </div>
          <HighlightedFeedback
            analysis={analysis}
            loading={analysisLoading}
          />
        </div>
      )}

      {/* Model Answer */}
      {submitted && model_answer && model_answer.trim().length > 0 && (
        <ModelAnswer
          answer={model_answer}
          title="Sample Model Summary Sentence"
          defaultOpen
        />
      )}
    </div>
  );
}
