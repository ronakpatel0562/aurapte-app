"use client";

import React, { useEffect, useRef, useState } from "react";
import ScoreBadge from "../shared/ScoreBadge";
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
      instruction?: string;
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
  const { passage, instruction } = question.content;

  const headerInstruction =
    instruction ||
    "Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.";

  const totalTimeSeconds = 600; // 10 minutes, matching PTE

  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ReturnType<
    typeof scoreSummarizeWrittenText
  > | null>(null);
  const [analysis, setAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [internalClipboard, setInternalClipboard] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Run linguistic analysis after submission (lazy-loads nspell + dictionary).
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
    setAnalysis(null);
    setElapsedTime(0);
  };

  // Cut/Copy/Paste — uses Clipboard API with internal fallback for older browsers.
  const handleCut = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
      setText(text.substring(0, start) + text.substring(end));
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
    const selectedText = text.substring(start, end);
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
      const val = text.substring(0, start) + clipText + text.substring(end);
      setText(val);
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

  // 1. ACTIVE PRACTICE PLAYER SCREEN — PTE Pearson style
  if (!submitted) {
    return (
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction */}
        <div className="px-6 py-5 bg-[#FAF9F6] text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200">
          {headerInstruction}
        </div>

        {/* White inner card containing the passage */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
          <div className="border border-gray-300 rounded p-5 text-[15px] leading-[1.65] text-gray-800 font-sans bg-white select-text">
            {passage}
          </div>
        </div>

        {/* Time tracker line (only the timer — word count lives below) */}
        <div className="flex justify-end gap-6 text-sm font-sans font-bold text-gray-700 mt-2 mb-2 px-6 select-none">
          <span className="tabular-nums">
            {formatTime(elapsedTime)} / {formatTime(totalTimeSeconds)}
          </span>
        </div>

        {/* Textarea editor box */}
        <div className="px-6 pb-6 bg-white">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              if (!timeLimitReached) setText(e.target.value);
            }}
            disabled={timeLimitReached}
            placeholder="Type your response here..."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            className="w-full h-36 p-4 border border-[#bfdbfe]/70 bg-white rounded text-[15px] font-sans focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 resize-y transition shadow-inner placeholder-gray-400 text-gray-800"
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

            <span className="text-sm font-sans font-bold text-gray-700">
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
          rawText={text}
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