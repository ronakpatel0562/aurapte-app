"use client";

import React from "react";
import AudioPromptBox from "../AudioPromptBox";

/**
 * Highlight Incorrect Words — steel-blue audio box (see
 * [[project_reuse_audio_component]]) followed by the spoken transcript as
 * clickable word tokens. The student toggles the words that were spoken
 * differently from the printed transcript; scoring is deferred to Next.
 */
export default function HighlightWordsExam({
  content,
  value,
  onChange,
}: {
  content: { audio_url?: string; passage_with_incorrect_words?: string };
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const passage = content.passage_with_incorrect_words || "";
  const words = passage.split(/\s+/).filter(Boolean);

  const cleanWord = (w: string) => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();

  const toggle = (word: string, index: number) => {
    const key = `${index}:${cleanWord(word)}`;
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
        You will hear a recording. Below is a transcript of the recording. Some words in the transcription differ
        from what the speaker(s) said. Please click on the words that are different.
      </p>

      <AudioPromptBox audioUrl={content.audio_url} onEnded={() => {}} />

      <div className="border border-gray-300 rounded bg-white p-6 text-[15px] leading-loose text-gray-800">
        {words.map((word, index) => {
          const key = `${index}:${cleanWord(word)}`;
          const isSel = value.includes(key);
          return (
            <span
              key={index}
              onClick={() => toggle(word, index)}
              className={`inline-block mx-0.5 px-1 py-0.5 rounded cursor-pointer transition ${
                isSel ? "bg-sky-100 border-b-2 border-sky-500 text-sky-900 font-medium" : "hover:bg-gray-100"
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
