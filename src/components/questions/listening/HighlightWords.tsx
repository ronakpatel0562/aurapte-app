"use client";

import React, { useState, useMemo } from "react";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreHighlightIncorrectWords } from "@/lib/scoring/listening";

interface HighlightWordsProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      correct_transcript: string;
      passage_with_incorrect_words: string;
      incorrect_words: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

interface WordToken {
  index: number;
  text: string;
  cleanText: string;
}

export default function HighlightWords({
  question,
  onSubmitAttempt,
  isSubmitting,
}: HighlightWordsProps) {
  const {
    audio_url,
    correct_transcript,
    passage_with_incorrect_words,
    incorrect_words,
  } = question.content;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // The DB only stores the clean transcript + the list of words that were
  // changed in the spoken version. We can't reconstruct what the wrong words
  // were without a separate `incorrect_transcript` field. When that's
  // missing, show a clear notice instead of pretending there are words to
  // click on.
  const hasInteractiveTranscript =
    !!passage_with_incorrect_words &&
    passage_with_incorrect_words.trim() !== correct_transcript.trim();

  // Clean helper
  const cleanWord = (word: string) =>
    word
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .trim();

  const incorrectWordsClean = useMemo(() => {
    return incorrect_words.map((w) => cleanWord(w));
  }, [incorrect_words]);

  // Tokenize the incorrect transcript
  const tokens = useMemo<WordToken[]>(() => {
    return passage_with_incorrect_words.split(/\s+/).map((word, index) => ({
      index,
      text: word,
      cleanText: cleanWord(word),
    }));
  }, [passage_with_incorrect_words]);

  const handleToggle = (index: number) => {
    if (submitted) return;
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;

    const userSelectedWords = selectedIndices.map(
      (idx) => tokens.find((t) => t.index === idx)?.cleanText || ""
    );

    const scoreResult = scoreHighlightIncorrectWords(
      userSelectedWords,
      incorrectWordsClean
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

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer audioUrl={audio_url} transcript={correct_transcript} hasSubmitted={submitted} />

      {/* Clickable Word Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Highlight Incorrect Words
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <p className="text-xs text-body leading-relaxed">
          Listen to the recording. Below is the transcript, but some words have
          been replaced. Click the words in the transcript that are different
          from what the speaker says.
        </p>

        {/* Interactive passage OR honest placeholder when the DB row is missing
            the incorrect-transcript field. */}
        {hasInteractiveTranscript ? (
          <div className="text-body-md text-ink leading-loose select-none font-geist py-2 select-text border border-hairline p-4 rounded-md bg-canvas-soft-2 pr-2">
            {tokens.map((token) => {
              const isSel = selectedIndices.includes(token.index);
              const isWordIncorrect = incorrectWordsClean.includes(
                token.cleanText
              );

              const getHighlightClass = () => {
                if (submitted) {
                  if (isWordIncorrect && isSel) {
                    return "bg-success/15 border-b-2 border-success text-success font-semibold";
                  }
                  if (!isWordIncorrect && isSel) {
                    return "bg-error/15 border-b-2 border-error text-error-deep font-semibold";
                  }
                  if (isWordIncorrect && !isSel) {
                    return "bg-warning-soft/30 border-b-2 border-dashed border-warning-deep text-warning-deep font-semibold";
                  }
                  return "";
                }
                return isSel
                  ? "bg-primary/10 border-b-2 border-primary text-ink font-semibold"
                  : "hover:bg-canvas border-b border-transparent";
              };

              return (
                <span
                  key={token.index}
                  onClick={() => handleToggle(token.index)}
                  className={`inline-block mx-0.5 px-0.5 rounded cursor-pointer transition select-none ${getHighlightClass()}`}
                  title={
                    submitted && isWordIncorrect && !isSel
                      ? `Incorrect term: ${token.text}`
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
            <p className="text-3xs font-bold font-mono uppercase tracking-wider text-warning-deep">
              Missing Data
            </p>
            <p className="text-3xs text-body leading-relaxed mt-1">
              This question does not include the transcript-with-substitutions
              field needed for interactive practice. The substituted words are
              listed below for reference.
            </p>
            <ul className="text-3xs text-body leading-relaxed mt-2 space-y-0.5 font-mono">
              {incorrect_words.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Legend */}
        {submitted && (
          <div className="flex flex-wrap gap-4 text-3xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-success/15 border-b-2 border-success" />
              <span className="text-body">Correct (Wrongly Spoken)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-error/15 border-b-2 border-error" />
              <span className="text-body">Incorrectly Flagged (Actually Correct)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-warning-soft/30 border-b-2 border-dashed border-warning-deep" />
              <span className="text-body">Missed Wrong Word</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasInteractiveTranscript}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Answers
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99]"
            >
              Try Again
            </button>
          )}
        </div>
      </div>

      {submitted && (
        <ModelAnswer
          answer={`Original text:\n"${correct_transcript}"\n\nReplaced terms:\n${incorrect_words
            .map((w) => `• "${w}"`)
            .join("\n")}`}
          title="Explanation & Original Transcript"
        />
      )}
    </div>
  );
}