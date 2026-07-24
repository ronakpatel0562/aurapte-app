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
  audioUrl,
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
  /** Recorded-answer blob URL, so the student can hear what they actually
   * said instead of only reading the auto-transcript below. */
  audioUrl?: string;
}) {
  const transcript = (answer || "").trim();

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  const readAloudDiff =
    taskType === "read_aloud" && content.passage && transcript
      ? diffWords(content.passage, transcript)
      : null;
  const passageDiff = readAloudDiff?.passageParts;
  const transcriptDiff = readAloudDiff?.transcriptParts;
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
            {passageDiff
              ? passageDiff.map((part, i) =>
                  part.type === "missing" ? (
                    <span key={i} className="text-error-deep line-through decoration-2">
                      {part.text}{" "}
                    </span>
                  ) : (
                    <span key={i}>{part.text} </span>
                  )
                )
              : content.passage}
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

      {/* Recorded answer playback */}
      {audioUrl && (
        <div>
          <EvalLabel>Your recorded answer</EvalLabel>
          <audio controls src={audioUrl} className="w-full h-10" />
        </div>
      )}

      {/* Captured transcript */}
      <div>
        <EvalLabel>What we heard (auto transcript)</EvalLabel>
        <div className="border border-gray-300 rounded bg-white p-4 text-[15px] leading-relaxed text-gray-800 min-h-[64px]">
          {transcriptDiff
            ? transcriptDiff.map((part, i) =>
                part.type === "extra" ? (
                  <span key={i} className="text-[#2980b9] font-semibold">
                    {part.text}{" "}
                  </span>
                ) : (
                  <span key={i}>{part.text} </span>
                )
              )
            : transcript
            ? transcript
            : <span className="text-gray-400 italic">No speech was captured.</span>}
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
        Speaking responses are scored on pronunciation, fluency and content in the real exam.
        The transcript above is captured on-device and is only indicative.
      </p>
    </div>
  );
}

type DiffPart = { text: string; type: "match" | "missing" | "extra" };

/**
 * Word-level diff via LCS, used to mark which words of the Read Aloud
 * passage were skipped/misread and which words in the captured transcript
 * were inserted — same idea as a text diff, applied to two word arrays.
 */
function diffWords(
  original: string,
  spoken: string
): { passageParts: DiffPart[]; transcriptParts: DiffPart[] } {
  const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
  const a = original.split(/\s+/).filter(Boolean);
  const b = spoken.split(/\s+/).filter(Boolean);
  const an = a.map(clean);
  const bn = b.map(clean);

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] =
        an[i] === bn[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const passageParts: DiffPart[] = [];
  const transcriptParts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (an[i] === bn[j]) {
      passageParts.push({ text: a[i], type: "match" });
      transcriptParts.push({ text: b[j], type: "match" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      passageParts.push({ text: a[i], type: "missing" });
      i++;
    } else {
      transcriptParts.push({ text: b[j], type: "extra" });
      j++;
    }
  }
  while (i < a.length) {
    passageParts.push({ text: a[i], type: "missing" });
    i++;
  }
  while (j < b.length) {
    transcriptParts.push({ text: b[j], type: "extra" });
    j++;
  }

  return { passageParts, transcriptParts };
}

const INSTRUCTIONS: Record<string, string> = {
  read_aloud: "Read the text aloud as naturally and clearly as you can.",
  repeat_sentence: "Repeat the sentence exactly as you heard it.",
  describe_image: "Describe in detail what the image is showing.",
  responding_to_situation: "Respond to the situation as completely as you can.",
  answer_short_question: "Give a short, simple answer to the question.",
};
