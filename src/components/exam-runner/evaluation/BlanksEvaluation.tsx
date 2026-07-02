"use client";

import React from "react";
import { EvalInstruction, TokenChip, ExpectedChip } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for all three fill-in-the-blanks task types (R&W blanks,
 * reading blanks, listening blanks). Renders the passage/transcript inline
 * with each blank replaced by the student's answer — emerald if it matches
 * the key, red if wrong, amber if left empty — followed by the expected
 * word whenever they didn't get it right.
 */
export default function BlanksEvaluation({
  content,
  user,
  instruction,
  variant,
}: {
  content: {
    passage_with_blanks?: string;
    audio_transcript_with_blanks?: string;
    audio_url?: string;
    answers?: Record<string, string>;
  };
  user: Record<string, string>;
  instruction: string;
  variant: "text" | "audio";
}) {
  const passage = content.passage_with_blanks || content.audio_transcript_with_blanks || "";
  const answers = content.answers || {};
  const parts = passage.split(/(\[blank_\d+\])/g);

  const isMatch = (a: string | undefined, b: string) =>
    !!a && a.trim().toLowerCase() === b.trim().toLowerCase();

  return (
    <div className="space-y-4 max-w-3xl">
      <EvalInstruction>{instruction}</EvalInstruction>
      {variant === "audio" && <EvalAudio audioUrl={content.audio_url} />}

      <div className="border border-gray-300 rounded bg-white p-6 text-[15px] leading-loose text-gray-800">
        {parts.map((part, index) => {
          const match = part.match(/\[(blank_\d+)\]/);
          if (!match) return <span key={index}>{part}</span>;

          const blankId = match[1];
          const expected = answers[blankId] ?? "";
          const given = user[blankId];
          const correct = isMatch(given, expected);

          return (
            <span key={blankId} className="whitespace-nowrap">
              {given ? (
                <TokenChip text={given} state={correct ? "correct" : "wrong"} />
              ) : (
                <TokenChip text="(blank)" state="missing" />
              )}
              {!correct && expected && <ExpectedChip text={expected} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
