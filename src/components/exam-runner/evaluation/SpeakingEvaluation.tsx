"use client";

import React from "react";
import { Info } from "lucide-react";
import { EvalInstruction, EvalLabel, ResultTag } from "./shared";
import EvalAudio from "./EvalAudio";

/**
 * Evaluation view for the spoken task types. Speech is captured as a live
 * transcript (see SpeakingRecorderFlow) and graded by AI in the real exam,
 * so we replay the prompt, show the transcript we captured, and — for the
 * two deterministic types (Read Aloud vs its passage, Answer Short Question
 * vs its key) — a light correctness cue. Everything else is indicative.
 */
export default function SpeakingEvaluation({
  taskType,
  content,
  answer,
}: {
  taskType: string;
  content: {
    passage?: string;
    image_url?: string;
    scenario?: string;
    question?: string;
    audio_url?: string;
    correct_answer?: string;
  };
  answer: string;
}) {
  const transcript = (answer || "").trim();

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const shortAnswerCorrect =
    taskType === "answer_short_question" && content.correct_answer
      ? norm(content.correct_answer)
          .split(/\s+/)
          .filter(Boolean)
          .every((w) => norm(transcript).split(/\s+/).includes(w))
      : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <EvalInstruction>{INSTRUCTIONS[taskType] ?? "Speak your response into the microphone."}</EvalInstruction>

      {/* Prompt context */}
      {content.passage && taskType === "read_aloud" && (
        <div>
          <EvalLabel>Text to read</EvalLabel>
          <div className="border border-gray-300 rounded bg-white p-4 text-[15px] leading-relaxed text-gray-800">
            {content.passage}
          </div>
        </div>
      )}
      {content.image_url && taskType === "describe_image" && (
        <div className="border border-gray-300 rounded overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.image_url} alt="Prompt" className="w-full h-auto" style={{ maxHeight: 360, objectFit: "contain" }} />
        </div>
      )}
      {content.scenario && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white text-[15px] leading-relaxed" style={{ color: "#2980b9" }}>
          <p>{content.scenario}</p>
          {content.question && <p className="mt-2">{content.question}</p>}
        </div>
      )}
      {content.audio_url && (taskType === "repeat_sentence" || taskType === "answer_short_question") && (
        <EvalAudio audioUrl={content.audio_url} />
      )}

      {/* Captured transcript */}
      <div>
        <EvalLabel>What we heard (auto transcript)</EvalLabel>
        <div className="border border-gray-300 rounded bg-white p-4 text-[15px] leading-relaxed text-gray-800 min-h-[64px]">
          {transcript ? transcript : <span className="text-gray-400 italic">No speech was captured.</span>}
        </div>
      </div>

      {/* Answer-short-question deterministic cue */}
      {shortAnswerCorrect !== null && (
        <div className="flex items-center justify-between gap-3 p-3 rounded border border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Expected answer:</span>{" "}
            <span className="text-emerald-700 font-semibold">{content.correct_answer}</span>
          </div>
          <ResultTag correct={shortAnswerCorrect} />
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Speaking responses are graded by AI on pronunciation, fluency and content in the real exam.
        The transcript above is captured on-device and is only indicative.
      </p>
    </div>
  );
}

const INSTRUCTIONS: Record<string, string> = {
  read_aloud: "Read the text aloud as naturally and clearly as you can.",
  repeat_sentence: "Repeat the sentence exactly as you heard it.",
  describe_image: "Describe in detail what the image is showing.",
  responding_to_situation: "Respond to the situation as completely as you can.",
  answer_short_question: "Give a short, simple answer to the question.",
};
