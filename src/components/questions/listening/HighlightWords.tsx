"use client";

import React, { useState, useMemo } from "react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreHighlightIncorrectWords } from "@/lib/scoring/listening";

interface HighlightWordsProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      /** Spoken version of the passage (with substituted words in it).
       *  Comes from the DB's `transcript` field via taskTypeMapper. */
      passage_with_incorrect_words: string;
      /** Words the student should click. Comes from the DB's
       *  `incorrect_words` field via taskTypeMapper. */
      incorrect_words: string[];
      audio_transcript?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

interface WordToken {
  index: number;
  text: string;
  cleanText: string;
  /** True when this token's clean form is in the incorrect_words list. */
  isTarget: boolean;
}

export default function HighlightWords({
  question,
  onSubmitAttempt,
  isSubmitting,
}: HighlightWordsProps) {
  const {
    audio_url,
    passage_with_incorrect_words,
    incorrect_words,
    audio_transcript,
  } = question.content;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Strip punctuation + lowercase for matching. The DB stores the spoken
  // words as bare tokens (no quotes / apostrophes), so we can compare
  // apples-to-apples against the user's clicks.
  const cleanWord = (word: string) =>
    word
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .trim();

  const incorrectSet = useMemo(
    () => new Set((incorrect_words ?? []).map(cleanWord).filter(Boolean)),
    [incorrect_words]
  );

  // Tokenize the spoken passage. We keep the original surface form so the
  // UI shows real punctuation/case, but we precompute the clean form for
  // matching and a `isTarget` flag so each token knows whether it's a
  // candidate answer.
  const tokens = useMemo<WordToken[]>(() => {
    if (!passage_with_incorrect_words) return [];
    return passage_with_incorrect_words.split(/\s+/).map((word, index) => {
      const cleanText = cleanWord(word);
      return {
        index,
        text: word,
        cleanText,
        isTarget: incorrectSet.has(cleanText),
      };
    });
  }, [passage_with_incorrect_words, incorrectSet]);

  const handleToggle = (index: number) => {
    if (submitted) return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;
    const userSelectedWords = selectedIndices
      .map((idx) => tokens.find((t) => t.index === idx)?.cleanText || "")
      .filter(Boolean);

    const scoreResult = scoreHighlightIncorrectWords(
      userSelectedWords,
      Array.from(incorrectSet)
    );

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userSelectedWords);
  };

  const handleReset = () => {
    setSelectedIndices([]);
    setSubmitted(false);
    setResult(null);
  };

  const hasInteractiveTranscript =
    tokens.length > 0 && incorrectSet.size > 0;

  return (
    <div className="space-y-6">
      <AudioPlayer audioUrl={audio_url} transcript={audio_transcript} hasSubmitted={submitted} />

      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Highlight Incorrect Words
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <div className="text-xs text-body leading-relaxed space-y-1">
          <p>
            Listen to the recording and read along. The transcript below contains
            some words that differ from what the speaker actually says.
          </p>
          <p>
            <strong className="text-ink">Click each word</strong> in the
            transcript that is different from what you hear in the audio.
          </p>
        </div>

        {/* Hint banner showing how many words need to be flagged. */}
        {hasInteractiveTranscript && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-canvas-soft-2 border border-hairline rounded-md">
            <span className="text-2xs font-mono uppercase tracking-wider text-mute">
              Words to find
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-ink tabular-nums">
                {selectedIndices.length}
              </span>
              <span className="text-mute">of</span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {incorrectSet.size}
              </span>
              <span className="text-mute">selected</span>
            </span>
          </div>
        )}

        {hasInteractiveTranscript ? (
          <div className="text-base text-ink leading-loose font-geist py-3 px-4 border border-hairline rounded-md bg-canvas-soft-2">
            {tokens.map((token) => {
              const isSel = selectedIndices.includes(token.index);
              const isWordIncorrect = token.isTarget;

              const highlightClass = (() => {
                if (submitted) {
                  if (isWordIncorrect && isSel) {
                    return "bg-success/15 border-b-2 border-success text-success font-semibold";
                  }
                  if (!isWordIncorrect && isSel) {
                    return "bg-error/15 border-b-2 border-error text-error-deep font-semibold";
                  }
                  if (isWordIncorrect && !isSel) {
                    return "bg-warning-soft/40 border-b-2 border-dashed border-warning-deep text-warning-deep font-semibold";
                  }
                  return "";
                }
                return isSel
                  ? "bg-primary/10 border-b-2 border-primary text-ink font-semibold"
                  : "hover:bg-canvas border-b border-transparent";
              })();

              return (
                <span
                  key={token.index}
                  onClick={() => handleToggle(token.index)}
                  className={`inline-block mx-0.5 px-0.5 rounded cursor-pointer transition ${highlightClass}`}
                  title={
                    submitted && isWordIncorrect && !isSel
                      ? `You missed this word: "${token.text}"`
                      : undefined
                  }
                >
                  {token.text}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="bg-warning-soft/30 border border-warning/30 rounded-md p-3.5">
            <p className="text-2xs font-bold font-mono uppercase tracking-wider text-warning-deep">
              Question Data Missing
            </p>
            <p className="text-xs text-body leading-relaxed mt-1">
              This question does not include the spoken passage or the list of
              substituted words needed for interactive practice. The expected
              incorrect words (if any) are listed below for reference.
            </p>
            {incorrect_words.length > 0 && (
              <ul className="text-2xs text-body leading-relaxed mt-2 space-y-0.5 font-mono">
                {incorrect_words.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Legend — visible during/after submit so the colour coding makes sense. */}
        {submitted && (
          <div className="flex flex-wrap gap-4 text-2xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-success/15 border-b-2 border-success" />
              <span className="text-body">Correctly flagged (spoken differently)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-error/15 border-b-2 border-error" />
              <span className="text-body">Flagged but actually correct (−1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-warning-soft/40 border-b-2 border-dashed border-warning-deep" />
              <span className="text-body">Missed incorrect word</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasInteractiveTranscript}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answers
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center active:scale-[0.99]"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
