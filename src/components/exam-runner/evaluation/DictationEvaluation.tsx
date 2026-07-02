"use client";

import React from "react";
import { EvalInstruction, EvalLabel } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for Write from Dictation. PTE marks this word-by-word, so
 * we mirror lib/scoring/listening's tokenised comparison: each correctly
 * typed word is emerald, each extra/misspelled word red, and the reference
 * sentence shows which words were captured (emerald) vs missed (amber).
 */
const clean = (t: string) =>
  t
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export default function DictationEvaluation({
  content,
  answer,
}: {
  content: { audio_url?: string; sentence?: string };
  answer: string;
}) {
  const correctSentence = content.sentence || "";
  const userTokens = (answer || "").split(/\s+/).filter(Boolean);
  const correctTokens = correctSentence.split(/\s+/).filter(Boolean);

  // Remaining multiset of expected words, consumed as we match user words.
  const remaining = new Map<string, number>();
  correctTokens.forEach((w) => {
    const k = clean(w);
    if (k) remaining.set(k, (remaining.get(k) || 0) + 1);
  });

  const userMarks = userTokens.map((w) => {
    const k = clean(w);
    const count = remaining.get(k) || 0;
    if (k && count > 0) {
      remaining.set(k, count - 1);
      return { word: w, correct: true };
    }
    return { word: w, correct: false };
  });

  // A second multiset to decide which reference words were captured.
  const captured = new Map<string, number>();
  userMarks.forEach(({ word, correct }) => {
    if (correct) {
      const k = clean(word);
      captured.set(k, (captured.get(k) || 0) + 1);
    }
  });
  const correctMarks = correctTokens.map((w) => {
    const k = clean(w);
    const count = captured.get(k) || 0;
    if (count > 0) {
      captured.set(k, count - 1);
      return { word: w, hit: true };
    }
    return { word: w, hit: false };
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <EvalInstruction>
        Type the sentence exactly as you hear it. Each word is scored individually.
      </EvalInstruction>

      <EvalAudio audioUrl={content.audio_url} />

      <div>
        <EvalLabel>Your response</EvalLabel>
        <div className="border border-gray-300 rounded bg-white p-4 text-[15px] leading-loose">
          {userMarks.length === 0 ? (
            <span className="text-gray-400 italic">No answer submitted.</span>
          ) : (
            userMarks.map((m, i) => (
              <span
                key={i}
                className={`inline-block mx-0.5 px-1 rounded ${
                  m.correct
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-900 line-through decoration-red-400"
                }`}
              >
                {m.word}
              </span>
            ))
          )}
        </div>
      </div>

      <div>
        <EvalLabel>
          <span className="text-emerald-600">Correct sentence</span>
        </EvalLabel>
        <div className="border border-emerald-500 bg-emerald-50/50 rounded p-4 text-[15px] leading-loose">
          {correctMarks.map((m, i) => (
            <span
              key={i}
              className={`inline-block mx-0.5 px-1 rounded ${
                m.hit ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
              }`}
            >
              {m.word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
