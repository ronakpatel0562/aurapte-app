"use client";

import React, { useEffect, useRef, useState } from "react";
import ScoreBadge from "../shared/ScoreBadge";
import HighlightedFeedback from "./HighlightedFeedback";
import { scoreWriteEmail } from "@/lib/scoring/writing";
import { parsePrompt } from "@/lib/linguistics/parsePrompt";
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
      instruction?: string;
      bullet_points?: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
  isPremium?: boolean;
}

export default function WriteEmail({
  question,
  onSubmitAttempt,
  isSubmitting,
  isPremium = false,
}: WriteEmailProps) {
  const { scenario, prompt, bullet_points, instruction } = question.content;

  const headerInstruction =
    instruction ||
    "Read the situation below and write an email to resolve the issue. Your response will be judged on the quality of your writing and how well you address the situation.";

  // The situation description and the 3-4 points to cover can arrive in two
  // shapes: an explicit `scenario` + `bullet_points` pair, or a single raw
  // `prompt` string that mixes the situation paragraph with a themes clause
  // (e.g. "...Your ideas must come from the following themes: Noise; Parking;
  // Garbage."). When `scenario` is missing, recover both pieces from `prompt`
  // so the situation text isn't silently dropped in favour of a bare bullet
  // list.
  const parsedFromPrompt = !scenario && prompt ? parsePrompt(prompt) : null;
  const description = scenario || parsedFromPrompt?.instruction || "";

  const cleanPoint = (s: string) => s.replace(/[;.,]+\s*$/, "").trim();
  const points: string[] =
    Array.isArray(bullet_points) && bullet_points.length > 0
      ? bullet_points.map(cleanPoint).filter(Boolean)
      : (parsedFromPrompt?.themes || []).map(cleanPoint).filter(Boolean);

  const totalTimeSeconds = 540; // 9 minutes

  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<
    typeof scoreWriteEmail
  > | null>(null);
  const [analysis, setAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [internalClipboard, setInternalClipboard] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Live timer that locks the textarea once it reaches the time limit.
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev >= totalTimeSeconds) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, totalTimeSeconds]);

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
    setElapsedTime(0);
  };

  // Cut/Copy/Paste — uses Clipboard API with internal fallback for older browsers.
  const handleCut = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = body.substring(start, end);
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
      setBody(body.substring(0, start) + body.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start);
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = body.substring(start, end);
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
    }
  };

  const handlePaste = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const pasteText = (clipText: string) => {
      const val = body.substring(0, start) + clipText + body.substring(end);
      setBody(val);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const cursorPosition = start + clipText.length;
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    };
    navigator.clipboard
      .readText()
      .then(pasteText)
      .catch(() => {
        if (internalClipboard) pasteText(internalClipboard);
      });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timeRemaining = Math.max(0, totalTimeSeconds - elapsedTime);
  const timeLimitReached = elapsedTime >= totalTimeSeconds;

  // Render the prompt content. Prefer the derived description + points
  // (see above); if neither could be recovered, fall back to the full raw
  // prompt text as-is so no words are dropped.
  const renderPromptBullets = () => {
    if (points.length > 0) {
      return points.map((bp, idx) => (
        <p
          key={idx}
          className="text-[16px] text-gray-800 leading-relaxed flex gap-2"
        >
          <span className="text-gray-400">•</span>
          <span>{bp}</span>
        </p>
      ));
    }
    if (description) return null;
    return (
      <p className="text-[16px] text-gray-800 leading-relaxed whitespace-pre-wrap">
        {prompt}
      </p>
    );
  };

  // 1. ACTIVE PRACTICE PLAYER SCREEN — PTE Pearson style
  if (!submitted) {
    return (
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction */}
        <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200">
          {headerInstruction}
        </div>

        {/* White inner card containing the scenario + bullet themes.
            When no explicit bullet_points/themes are supplied, the entire
            prompt is shown as a single paragraph so nothing is lost or
            unintentionally line-wrapped. */}
        <div className="px-7 pt-7 pb-5 bg-white border-b border-gray-200 space-y-5">
          {/* Situation paragraph — prefer the scenario field; fall back to
              the situation text recovered from the raw prompt. */}
          {description ? (
            <p className="text-[16px] text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
              {description}
            </p>
          ) : null}

          {/* Bullet list (themes) or, if none could be recovered, the full
              prompt as a single paragraph. */}
          {(points.length > 0 || !description) && (
            <div className="border border-gray-300 rounded p-6 bg-white space-y-3 select-text">
              {renderPromptBullets()}
            </div>
          )}
        </div>

        {/* Time tracker line (only the timer — word count lives below) */}
        <div className="flex justify-end gap-6 text-base font-sans font-bold text-gray-700 mt-2 mb-2 px-7 select-none">
          <span className="tabular-nums">
            {formatTime(elapsedTime)} / {formatTime(totalTimeSeconds)}
          </span>
        </div>

        {/* Textarea editor box */}
        <div className="px-7 pb-7 bg-white">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              if (!timeLimitReached) setBody(e.target.value);
            }}
            disabled={timeLimitReached}
            placeholder="Type your email here..."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            className="w-full h-52 p-5 border border-[#bfdbfe]/70 bg-white rounded text-[17px] font-sans focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 resize-y transition shadow-inner placeholder-gray-400 text-gray-800"
          />

          <div className="flex justify-between items-center mt-3 select-none">
            <div className="flex gap-2">
              <button
                onClick={handleCut}
                disabled={timeLimitReached}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Cut
              </button>
              <button
                onClick={handleCopy}
                disabled={timeLimitReached}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Copy
              </button>
              <button
                onClick={handlePaste}
                disabled={timeLimitReached}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Paste
              </button>
            </div>

            <span className="text-base font-sans font-bold text-gray-700">
              Word Count:{" "}
              <span className="text-[#0284c7]">{wordCount}</span>
            </span>
          </div>
        </div>

        {/* Practice footer panel — gray bar with dark "SUBMIT & CHECK" button */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount === 0}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "SUBMIT & CHECK"}
          </button>
          <span className="ml-4 text-xs text-gray-700 font-bold tabular-nums select-none">
            {formatTime(timeRemaining)} remaining
          </span>
        </div>
      </div>
    );
  }

  // 2. SUBMITTED FEEDBACK & REVIEW SCREEN
  return (
    <div className="space-y-6">
      {/* Your Attempt & Feedback */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5 reveal-up">
        <div className="flex justify-between items-center pb-4 border-b border-hairline select-none">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Your Attempt &amp; Feedback
          </span>
          <div className="flex items-center gap-3">
            {submitted && (
              <span className="text-[10px] font-mono font-semibold text-success uppercase bg-success/5 border border-success/15 px-2.5 py-1 rounded">
                Submitted ✓
              </span>
            )}
            {result && (
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            )}
          </div>
        </div>

        {/* User response with in-line spelling/grammar highlights */}
        <HighlightedFeedback
          analysis={analysis}
          loading={analysisLoading}
          rawText={body}
        />

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline select-none">
          <button
            onClick={handleReset}
            className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}