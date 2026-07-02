"use client";

import React, { useRef } from "react";
import AudioPromptBox from "../AudioPromptBox";

/**
 * Write from Dictation — steel-blue audio box (see
 * [[project_reuse_audio_component]]) followed by a plain textarea with
 * Cut/Copy/Paste. The student types the sentence exactly as heard.
 */
export default function WriteDictationExam({
  content,
  value,
  onChange,
}: {
  content: { audio_url?: string };
  value: string;
  onChange: (v: string) => void;
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
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
        You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the
        sentence as you can. You will hear the sentence only once.
      </p>

      <AudioPromptBox audioUrl={content.audio_url} onEnded={() => {}} />

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type the sentence here…"
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
