"use client";

import React from "react";
import { Check, X } from "lucide-react";

/**
 * Shared primitives for the post-submit evaluation screen. The evaluation
 * view mirrors the colour language of the dashboard practice components in
 * src/components/questions/* (emerald = correct, red = the user's wrong
 * pick, neutral = untouched) so a student sees the same feedback whether
 * they practised a single question or ran the whole exam-clone module.
 */

export const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const hasLetterPrefix = (opt: string): boolean => {
  if (!opt || opt.length < 3) return false;
  return LETTERS.includes(opt[0]) && (opt[1] === ")" || opt[1] === ".");
};

export const stripPrefix = (opt: string): string =>
  hasLetterPrefix(opt) ? opt.slice(2).trim() : opt;

export const displayOption = (opt: string, i: number): string =>
  hasLetterPrefix(opt) ? opt : `${LETTERS[i] || String.fromCharCode(65 + i)}) ${opt}`;

/** Normalises a word for loose comparison (lowercase, punctuation stripped). */
export const cleanWord = (w: string): string =>
  w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();

/** Instruction line above an evaluated question, matching the exam bodies. */
export function EvalInstruction({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">{children}</p>;
}

/** Section heading used inside an evaluation panel (e.g. "Your answer"). */
export function EvalLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[13px] font-bold text-gray-400 font-mono uppercase tracking-wider mb-2">
      {children}
    </h4>
  );
}

/** Left-column reference passage/transcript block. */
export function EvalPassage({ text }: { text: string }) {
  return (
    <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[440px] overflow-y-auto pr-2">
      {text}
    </div>
  );
}

/** Small inline correct/incorrect tag. */
export function ResultTag({ correct }: { correct: boolean }) {
  return correct ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider text-emerald-700">
      <Check className="w-3.5 h-3.5 stroke-[3]" /> Correct
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider text-red-700">
      <X className="w-3.5 h-3.5 stroke-[3]" /> Incorrect
    </span>
  );
}

/**
 * Inline chip for a filled blank / a single dictation word. `state`:
 *  - "correct"  → user matched the key (emerald)
 *  - "wrong"    → user answered but it's wrong (red)
 *  - "missing"  → user left it blank (amber, shows the expected answer)
 */
export function TokenChip({
  text,
  state,
}: {
  text: string;
  state: "correct" | "wrong" | "missing";
}) {
  const styles =
    state === "correct"
      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
      : state === "wrong"
      ? "border-red-500 bg-red-50 text-red-800 line-through decoration-red-400"
      : "border-amber-400 bg-amber-50 text-amber-800";
  return (
    <span
      className={`inline-flex items-center h-7 mx-1 px-2 rounded border text-[14px] font-medium align-middle ${styles}`}
    >
      {text}
    </span>
  );
}

/** The green "expected answer" chip shown next to a wrong/missing blank. */
export function ExpectedChip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center h-7 mx-1 px-2 rounded border border-emerald-500 bg-emerald-50 text-emerald-800 text-[14px] font-semibold align-middle">
      {text}
    </span>
  );
}
