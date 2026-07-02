"use client";

import React, { useRef } from "react";
import AudioPromptBox from "../AudioPromptBox";

/**
 * Summarize Spoken Text — steel-blue audio box (see [[project_reuse_audio_component]])
 * followed by the word-limit/elapsed-time line and a textarea with
 * Cut/Copy/Paste, matching the real PTE test driver exactly (see the
 * recorded reference video: "0 / 30 words Limit   00:01/ 08:00").
 */
export default function SummarizeSpokenExam({
  content,
  value,
  onChange,
  elapsedSeconds,
  budgetSeconds,
}: {
  content: { audio_url?: string };
  value: string;
  onChange: (v: string) => void;
  elapsedSeconds: number;
  budgetSeconds: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const clipboardRef = useRef("");

  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    const limitM = Math.floor(budgetSeconds / 60).toString().padStart(2, "0");
    const limitS = (budgetSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}/ ${limitM}:${limitS}`;
  };

  const handleCut = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.substring(start, end);
    if (!selected) return;
    navigator.clipboard.writeText(selected).catch(() => {});
    clipboardRef.current = selected;
    onChange(value.substring(0, start) + value.substring(end));
  };

  const handleCopy = () => {
    const el = textareaRef.current;
    if (!el) return;
    const selected = value.substring(el.selectionStart, el.selectionEnd);
    if (!selected) return;
    navigator.clipboard.writeText(selected).catch(() => {});
    clipboardRef.current = selected;
  };

  const handlePaste = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const apply = (clipText: string) => onChange(value.substring(0, start) + clipText + value.substring(end));
    navigator.clipboard
      .readText()
      .then(apply)
      .catch(() => {
        if (clipboardRef.current) apply(clipboardRef.current);
      });
  };

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
        You will hear a short report. Write a summary of 20-30 words. You have 8 minutes to finish this task. Your
        response will be judged on the quality of your writing and on how well your response presents the key
        points presented in the lecture.
      </p>

      <AudioPromptBox audioUrl={content.audio_url} onEnded={() => {}} />

      <div className="flex justify-end gap-6 text-sm font-semibold text-gray-700 mb-2">
        <span>{wordCount} / 30 words Limit</span>
        <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your summary here…"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        className="w-full h-32 p-3 border border-teal-600/70 rounded text-[15px] font-sans focus:outline-none focus:border-teal-600 resize-y bg-white text-gray-800"
      />
      <div className="text-right text-xs text-gray-600 mt-1 mb-3">
        Word Count: <span>{wordCount}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCut}
          className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 font-medium rounded bg-white transition"
        >
          Cut
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 font-medium rounded bg-white transition"
        >
          Copy
        </button>
        <button
          onClick={handlePaste}
          className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 font-medium rounded bg-white transition"
        >
          Paste
        </button>
      </div>
    </div>
  );
}
