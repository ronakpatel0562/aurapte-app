"use client";

import React from "react";
import SpeakingRecorderFlow, { SpeakingStep } from "../SpeakingRecorderFlow";

const PREP_SECONDS = 25;
const RECORD_SECONDS = 30;

const STEPS: SpeakingStep[] = [
  { kind: "wait", seconds: PREP_SECONDS, message: (n) => `Recording in ${n} seconds` },
  { kind: "record", seconds: RECORD_SECONDS },
];

/**
 * The fixed, un-scored "Personal Introduction" prompt that opens every
 * real PTE Speaking section — not a DB question, so the text is hardcoded
 * to match the exam driver verbatim.
 */
export default function PersonalIntroScreen({
  onAnswerChange,
  onLockChange,
}: {
  onAnswerChange: (transcript: string) => void;
  onLockChange?: (locked: boolean) => void;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-1">
        Read the prompt below. In {PREP_SECONDS} seconds, you must reply in your own words, as naturally and
        clearly as possible. You have {RECORD_SECONDS} seconds to record your response. Your response will be
        sent together with your score report to the institutions selected by you.
      </p>
      <p className="text-sm text-gray-800 leading-relaxed mt-3 mb-2">
        Please introduce yourself. For example, you could talk about one of the following.
      </p>
      <ul className="text-sm text-gray-800 space-y-0.5 mb-2">
        <li>- Your interests</li>
        <li>- Your plans for future study</li>
        <li>- Why you want to study abroad</li>
        <li>- Why you need to learn English</li>
        <li>- Why you chose this test</li>
      </ul>

      <SpeakingRecorderFlow steps={STEPS} onAnswerChange={onAnswerChange} onLockChange={onLockChange} />
    </div>
  );
}
