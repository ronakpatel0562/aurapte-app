"use client";

import React, { useEffect, useState } from "react";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import HighlightedFeedback from "./HighlightedFeedback";
import { scoreWriteEmail } from "@/lib/scoring/writing";
import {
  analyzeLinguistics,
  LinguisticAnalysis,
} from "@/lib/linguistics/analyze";

interface WriteEmailProps {
  question: {
    id: string;
    title: string;
    content: {
      scenario: string;
      prompt: string;
      model_answer: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function WriteEmail({
  question,
  onSubmitAttempt,
  isSubmitting,
}: WriteEmailProps) {
  const { scenario, prompt, model_answer } = question.content;

  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<
    typeof scoreWriteEmail
  > | null>(null);
  const [analysis, setAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // After submission, lazy-load nspell + dictionary-en and analyse the user's
  // text for spelling, capitalization, duplication, and punctuation issues.
  useEffect(() => {
    if (!submitted) return;
    let cancelled = false;
    setAnalysisLoading(true);
    analyzeLinguistics(body)
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
  }, [submitted, body]);

  const getWordCount = (val: string) => {
    return val.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(body);

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreWriteEmail(body);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, { body });
  };

  const handleReset = () => {
    setBody("");
    setSubmitted(false);
    setResult(null);
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* Scenario & Instructions Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
        <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider block">
          Email Writing Prompt
        </span>
        <div className="space-y-2 select-text font-geist">
          <p className="text-body-sm font-semibold text-ink">
            Scenario: {scenario}
          </p>
          <p className="text-xs text-body leading-relaxed">Prompt: {prompt}</p>
        </div>
      </div>

      {/* Email Editor Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Compose Email
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
          Write your email response below. Aim for 50–120 words, include a
          greeting and a sign-off, and address every point in the prompt.
        </p>

        {/* Body */}
        <div className="space-y-2 font-geist">
          <textarea
            id="email-body"
            value={body}
            onChange={(e) => !submitted && setBody(e.target.value)}
            disabled={submitted}
            placeholder="Dear ...&#10;&#10;Write your email here...&#10;&#10;Kind regards,&#10;Your name"
            className="w-full h-44 p-4 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-hairline-strong transition resize-y font-geist"
          />
          <div className="flex justify-between items-center text-3xs font-mono">
            <span
              className={`${
                wordCount >= 50 && wordCount <= 120
                  ? "text-success font-semibold"
                  : "text-mute"
              }`}
            >
              Words: {wordCount} (Target: 50–120)
            </span>
            {wordCount > 0 && (wordCount < 50 || wordCount > 120) && (
              <span className="text-warning-deep">
                Word count must be between 50 and 120 words.
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
              Submit Email
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

      {/* Evaluation Panel — structural breakdown */}
      {submitted && result && (
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-hairline">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Evaluation
            </span>
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          </div>
          <ul className="text-xs text-body leading-relaxed space-y-1.5 font-geist">
            <li className="flex items-center gap-2">
              <span
                className={
                  result.isWithinWordLimit ? "text-success" : "text-error"
                }
              >
                {result.isWithinWordLimit ? "✓" : "✗"}
              </span>
              Word count within 50–120 ({result.wordCount} words)
            </li>
            <li className="flex items-center gap-2">
              <span
                className={result.hasGreeting ? "text-success" : "text-error"}
              >
                {result.hasGreeting ? "✓" : "✗"}
              </span>
              Contains a greeting (Dear / Hi / Hello / etc.)
            </li>
            <li className="flex items-center gap-2">
              <span
                className={result.hasSignOff ? "text-success" : "text-error"}
              >
                {result.hasSignOff ? "✓" : "✗"}
              </span>
              Contains a sign-off (Regards / Best / Thanks / etc.)
            </li>
            <li className="flex items-center gap-2">
              <span
                className={
                  result.hasMultipleSentences ? "text-success" : "text-error"
                }
              >
                {result.hasMultipleSentences ? "✓" : "✗"}
              </span>
              Multiple sentences ({result.sentenceCount} detected)
            </li>
          </ul>
        </div>
      )}

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

      {/* Model Answer — absolute answer from the database */}
      {submitted && model_answer && model_answer.trim().length > 0 && (
        <ModelAnswer
          answer={model_answer}
          title="Sample Model Email Response"
          defaultOpen
        />
      )}
    </div>
  );
}