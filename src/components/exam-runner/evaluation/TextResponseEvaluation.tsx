"use client";

import React from "react";
import { Check, X, Info } from "lucide-react";
import { scoreSummarizeWrittenText, scoreWriteEmail } from "@/lib/scoring/writing";
import { scoreSummarizeSpoken } from "@/lib/scoring/listening";
import { EvalInstruction, EvalLabel, EvalPassage } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for the free-text productive task types (Summarize
 * Written Text, Write Email, Summarize Spoken Text). These are AI-graded in
 * the real exam, so instead of a hard right/wrong we surface the structural
 * criteria our approximate scorer checks (word count window, single
 * sentence, greeting/sign-off …) as a pass/fail checklist beside the
 * student's own response.
 */
type Criterion = { label: string; pass: boolean; detail?: string };

export default function TextResponseEvaluation({
  taskType,
  content,
  answer,
}: {
  taskType: string;
  content: {
    passage?: string;
    scenario?: string;
    prompt?: string;
    bullet_points?: string[];
    audio_url?: string;
    transcript?: string;
  };
  answer: string;
}) {
  const { instruction, context, criteria } = buildView(taskType, content, answer);

  return (
    <div className="space-y-5 max-w-3xl">
      <EvalInstruction>{instruction}</EvalInstruction>

      {context}

      <div>
        <EvalLabel>Your response</EvalLabel>
        <div className="border border-gray-300 rounded bg-white p-4 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[80px]">
          {answer?.trim() ? answer : <span className="text-gray-400 italic">No response submitted.</span>}
        </div>
      </div>

      <div>
        <EvalLabel>Scoring checklist</EvalLabel>
        <ul className="space-y-2">
          {criteria.map((c, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded border text-sm ${
                c.pass ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  c.pass ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {c.pass ? (
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                ) : (
                  <X className="w-3 h-3 text-white stroke-[3]" />
                )}
              </span>
              <span className="leading-relaxed">
                <span className="font-medium text-gray-800">{c.label}</span>
                {c.detail && <span className="text-gray-500"> — {c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        This is an indicative structural score. In the real exam this task is scored on content,
        grammar, vocabulary and fluency.
      </p>
    </div>
  );
}

function buildView(
  taskType: string,
  content: TextResponseEvaluationContent,
  answer: string
): { instruction: string; context: React.ReactNode; criteria: Criterion[] } {
  if (taskType === "write_an_email") {
    const r = scoreWriteEmail(answer);
    return {
      instruction: "Read the situation and write an email to resolve the issue.",
      context: (
        <div className="border border-gray-200 rounded-lg p-4 bg-white text-[15px] leading-relaxed text-gray-800">
          {content.scenario && <p className="mb-2 whitespace-pre-wrap">{content.scenario}</p>}
          {Array.isArray(content.bullet_points) && content.bullet_points.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {content.bullet_points.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          )}
        </div>
      ),
      criteria: [
        { label: "Within 50–120 words", pass: r.isWithinWordLimit, detail: `${r.wordCount} words` },
        { label: "Opens with a greeting", pass: r.hasGreeting },
        { label: "Ends with a sign-off", pass: r.hasSignOff },
        { label: "Developed in multiple sentences", pass: r.hasMultipleSentences, detail: `${r.sentenceCount} sentences` },
      ],
    };
  }

  if (taskType === "summarize_spoken_text") {
    const r = scoreSummarizeSpoken(answer, 20, 30);
    return {
      instruction: "Summarize the recording you heard in your own words.",
      context: <EvalAudio audioUrl={content.audio_url} />,
      criteria: [
        { label: "Within the required word range", pass: r.isWithinLimit, detail: `${r.wordCount} words` },
      ],
    };
  }

  // summarize_written_text (default)
  const r = scoreSummarizeWrittenText(answer);
  return {
    instruction: "Summarize the passage below in a single sentence.",
    context: content.passage ? (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <EvalPassage text={content.passage} />
      </div>
    ) : null,
    criteria: [
      { label: "Within 5–75 words", pass: r.isWithinWordLimit, detail: `${r.wordCount} words` },
      { label: "Written as a single sentence", pass: r.isSingleSentence },
    ],
  };
}

type TextResponseEvaluationContent = {
  passage?: string;
  scenario?: string;
  prompt?: string;
  bullet_points?: string[];
  audio_url?: string;
  transcript?: string;
};
