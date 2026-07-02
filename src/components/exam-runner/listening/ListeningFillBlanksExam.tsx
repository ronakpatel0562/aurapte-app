"use client";

import React from "react";
import AudioPromptBox from "../AudioPromptBox";

/**
 * Listening: Fill in the Blanks — steel-blue audio box (see
 * [[project_reuse_audio_component]]) followed by the transcript with typed
 * text-input blanks (unlike the reading fill-blanks types, this one is
 * typed from what you hear, not selected from a bank/dropdown).
 */
export default function ListeningFillBlanksExam({
  content,
  value,
  onChange,
}: {
  content: { audio_url?: string; audio_transcript_with_blanks?: string };
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const transcript = content.audio_transcript_with_blanks || "";
  const parts = transcript.split(/(\[blank_\d+\])/g);

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
        You will hear a recording. Type the missing words in each blank.
      </p>

      <AudioPromptBox audioUrl={content.audio_url} onEnded={() => {}} />

      <div className="border border-gray-300 rounded bg-white p-6 text-[15px] leading-loose text-gray-800">
        {parts.map((part, index) => {
          const match = part.match(/\[(blank_\d+)\]/);
          if (match) {
            const blankId = match[1];
            return (
              <input
                key={blankId}
                type="text"
                value={value[blankId] || ""}
                onChange={(e) => onChange({ ...value, [blankId]: e.target.value })}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                className="inline-block h-8 w-32 mx-1.5 border border-gray-400 rounded px-2 text-sm align-middle focus:outline-none focus:border-teal-600"
              />
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
}
