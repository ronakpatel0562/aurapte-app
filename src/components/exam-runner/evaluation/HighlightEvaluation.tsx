"use client";

import React from "react";
import { cleanWord, EvalInstruction } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for Highlight Incorrect Words. Every word the student
 * clicked is compared against the words that actually differed from the
 * recording:
 *   emerald  = correctly flagged word (a real hit)
 *   red      = flagged a word that was fine (a penalty)
 *   amber    = a genuinely wrong word the student missed
 * User selections are encoded "index:word" so repeated words stay distinct.
 */
export default function HighlightEvaluation({
  content,
  selectedKeys,
}: {
  content: { audio_url?: string; passage_with_incorrect_words?: string; incorrect_words?: string[] };
  selectedKeys: string[];
}) {
  const passage = content.passage_with_incorrect_words || "";
  const words = passage.split(/\s+/).filter(Boolean);
  const incorrect = new Set((content.incorrect_words || []).map(cleanWord));
  const selected = new Set(selectedKeys);

  return (
    <div className="space-y-4 max-w-3xl">
      <EvalInstruction>
        Below is the transcript. The words that differed from the recording are marked — compare
        them with the words you clicked.
      </EvalInstruction>

      <EvalAudio audioUrl={content.audio_url} />

      <div className="border border-gray-300 rounded bg-white p-6 text-[15px] leading-loose text-gray-800">
        {words.map((word, index) => {
          const key = `${index}:${cleanWord(word)}`;
          const isTarget = incorrect.has(cleanWord(word));
          const isPicked = selected.has(key);

          let cls = "";
          if (isTarget && isPicked) {
            cls = "bg-emerald-100 border-b-2 border-emerald-500 text-emerald-900 font-semibold";
          } else if (isTarget && !isPicked) {
            cls = "bg-amber-100 border-b-2 border-amber-500 text-amber-900 font-medium";
          } else if (!isTarget && isPicked) {
            cls = "bg-red-100 border-b-2 border-red-500 text-red-900 line-through";
          }

          return (
            <span key={index} className={`inline-block mx-0.5 px-1 py-0.5 rounded ${cls}`}>
              {word}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-wider">
        <Legend color="bg-emerald-500" label="Correctly flagged" />
        <Legend color="bg-amber-500" label="Missed error" />
        <Legend color="bg-red-500" label="Wrongly flagged" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-500">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
