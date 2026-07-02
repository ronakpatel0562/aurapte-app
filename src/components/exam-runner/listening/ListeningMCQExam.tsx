"use client";

import React from "react";
import AudioPromptBox from "../AudioPromptBox";

/**
 * Listening: Multiple Choice — shared body for Choose Single Answer,
 * Choose Multiple Answer, and Select Missing Word (single-select from a
 * lettered options list, no question stem). Audio box (see
 * [[project_reuse_audio_component]]) + options, no inline scoring — the
 * exam clone defers scoring to Next.
 */
export default function ListeningMCQExam({
  content,
  multiple,
  value,
  onChange,
  instruction,
}: {
  content: { audio_url?: string; question?: string; options?: string[] };
  multiple: boolean;
  value: string[];
  onChange: (v: string[]) => void;
  instruction: string;
}) {
  const options = content.options || [];

  const toggle = (option: string) => {
    const letter = option[0];
    if (multiple) {
      onChange(value.includes(letter) ? value.filter((v) => v !== letter) : [...value, letter]);
    } else {
      onChange([letter]);
    }
  };

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">{instruction}</p>

      <AudioPromptBox audioUrl={content.audio_url} onEnded={() => {}} />

      {content.question && (
        <h3 className="text-base font-bold text-gray-800 leading-normal pb-3 mb-3 border-b border-gray-200">
          {content.question}
        </h3>
      )}

      <div className="space-y-3">
        {options.map((option, index) => {
          const letter = option[0];
          const isSel = value.includes(letter);
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(option)}
              className="w-full text-left flex items-start gap-3 group py-1"
            >
              <span
                className={`w-5 h-5 shrink-0 mt-0.5 border flex items-center justify-center transition ${
                  multiple ? "rounded" : "rounded-full"
                } ${isSel ? "bg-[#1e7a9c] border-[#1e7a9c]" : "border-gray-400 bg-white group-hover:border-gray-600"}`}
              >
                {isSel && <span className={`bg-white ${multiple ? "w-2.5 h-2.5 rounded-[2px]" : "w-2 h-2 rounded-full"}`} />}
              </span>
              <span className="text-[15px] text-gray-700 leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
