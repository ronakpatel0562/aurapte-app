"use client";

import React, { useRef } from "react";

/**
 * Shared body for Summarize Written Text and Write an Email — both are a
 * bold instruction line, a white prompt box, and a textarea with
 * Cut/Copy/Paste buttons + a live word count. Matches the real PTE test
 * driver's writing screen (light gray canvas, no card chrome — the exam
 * shell supplies that).
 */
export default function WritingTaskFlow({
  title,
  prompt,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  prompt: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const clipboardRef = useRef("");

  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

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
      <div className="text-sm font-bold text-gray-800 mb-4">{title}</div>

      <div className="border border-gray-300 rounded bg-white p-5 leading-relaxed text-[15px] text-gray-800 mb-4">
        {prompt}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        className="w-full h-28 p-3 border border-teal-600/70 rounded text-[15px] font-sans focus:outline-none focus:border-teal-600 resize-y bg-white text-gray-800"
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
