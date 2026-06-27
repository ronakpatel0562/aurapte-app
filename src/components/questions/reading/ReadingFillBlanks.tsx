"use client";

import React, { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import { scoreReadingFillInBlanks } from "@/lib/scoring/reading";

interface ReadingFillBlanksProps {
  question: {
    id: string;
    title: string;
    content: {
      passage_with_blanks: string;
      word_bank: string[];
      answers: Record<string, string>;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

function DraggableWord({ word, disabled, isSelected, onClick }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: word,
    disabled: disabled,
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 50,
    }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
      onClick={!disabled ? onClick : undefined}
      className={`px-3 py-1.5 bg-canvas border rounded font-mono text-xs font-semibold select-none transition shadow-vercel-card ${disabled
          ? "opacity-30 border-hairline text-mute cursor-not-allowed"
          : isSelected
            ? "border-primary bg-canvas-soft-2 text-ink ring-2 ring-primary ring-opacity-20 cursor-pointer"
            : "border-hairline hover:border-hairline-strong text-body cursor-grab active:cursor-grabbing"
        } ${isDragging ? "opacity-50" : ""}`}
    >
      {word}
    </div>
  );
}

function DroppableBlank({
  id,
  filledWord,
  isSubmitted,
  isCorrect,
  correctAnswer,
  onClick,
}: any) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isSubmitted,
  });

  const getStyles = () => {
    if (isSubmitted) {
      return isCorrect
        ? "border-success/30 bg-success/5 text-success font-semibold"
        : "border-error/30 bg-error/5 text-error-deep font-semibold";
    }
    if (isOver) {
      return "border-primary bg-canvas-soft-2 text-ink scale-102";
    }
    return filledWord
      ? "border-hairline-strong bg-canvas-soft text-ink font-semibold"
      : "border-hairline border-dashed bg-canvas text-mute";
  };

  return (
    <span
      ref={setNodeRef}
      onClick={!isSubmitted ? onClick : undefined}
      className={`inline-flex items-center justify-center min-w-[120px] h-7 mx-1 border rounded px-2.5 text-xs align-middle transition duration-150 ${!isSubmitted ? "cursor-pointer hover:border-hairline-strong" : ""
        } ${getStyles()}`}
    >
      {filledWord || <span className="font-normal text-3xs uppercase tracking-wider">Select</span>}
      {isSubmitted && !isCorrect && (
        <span className="inline-flex items-center gap-0.5 ml-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-mono font-semibold border border-success/20 shadow-sm align-middle select-text">
          ✓ {correctAnswer}
        </span>
      )}
    </span>
  );
}

export default function ReadingFillBlanks({
  question,
  onSubmitAttempt,
  isSubmitting,
}: ReadingFillBlanksProps) {
  const { passage_with_blanks, word_bank, answers: correctAnswers } = question.content;

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Split passage text by brackets, keeping the brackets to identify inputs
  const parts = passage_with_blanks.split(/(\[blank_\d+\])/g);

  // Keep track of which words have been placed in blanks
  const placedWords = Object.values(userAnswers);

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;

    if (over && active) {
      const word = active.id as string;
      const blankId = over.id as string;

      setUserAnswers((prev) => {
        // If the word was already placed in another blank, remove it from there
        const filtered = { ...prev };
        Object.keys(filtered).forEach((k) => {
          if (filtered[k] === word) delete filtered[k];
        });
        return {
          ...filtered,
          [blankId]: word,
        };
      });
      setSelectedWord(null);
      setValidationError(null);
    }
  };

  const handleWordClick = (word: string) => {
    if (submitted) return;
    setSelectedWord((prev) => (prev === word ? null : word));
    setValidationError(null);
  };

  const handleBlankClick = (blankId: string) => {
    if (submitted) return;
    setValidationError(null);

    if (selectedWord) {
      // Place selected word in this blank
      setUserAnswers((prev) => {
        const filtered = { ...prev };
        // Remove word from any other blank it was placed in
        Object.keys(filtered).forEach((k) => {
          if (filtered[k] === selectedWord) delete filtered[k];
        });
        return {
          ...filtered,
          [blankId]: selectedWord,
        };
      });
      setSelectedWord(null);
    } else if (userAnswers[blankId]) {
      // Clear this blank if clicked and no word is selected
      setUserAnswers((prev) => {
        const copy = { ...prev };
        delete copy[blankId];
        return copy;
      });
    }
  };

  const handleSubmit = () => {
    if (submitted) return;

    // Validate that all blanks have been filled
    const isPending = Object.keys(correctAnswers).some((key) => !userAnswers[key]);
    if (isPending) {
      setValidationError("Please fill all the blanks before submitting.");
      return;
    }
    setValidationError(null);

    const scoreResult = scoreReadingFillInBlanks(userAnswers, correctAnswers);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userAnswers);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSelectedWord(null);
    setSubmitted(false);
    setResult(null);
    setValidationError(null);
  };

  // Convert passage to highlighted readable text for model answer
  const getHighlightedModelPassage = () => {
    return (
      <>
        {parts.map((part, index) => {
          const match = part.match(/\[(blank_\d+)\]/);
          if (match) {
            const blankId = match[1];
            const correctAnswer = correctAnswers[blankId] || "";
            return (
              <strong
                key={blankId}
                className="inline bg-success/10 text-success font-semibold px-1.5 py-[2px] rounded mx-1 border border-success/20 select-text align-baseline"
              >
                {correctAnswer}
              </strong>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Interaction Panel */}
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-hairline">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Fill in the Blanks (Drag and Drop)
            </span>
            {submitted && result && (
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            )}
          </div>

          {/* Passage rendering */}
          <div className="text-body-md text-ink leading-loose font-geist select-text pr-2 py-2">
            {parts.map((part, index) => {
              const match = part.match(/\[(blank_\d+)\]/);
              if (match) {
                const blankId = match[1];
                const filledWord = userAnswers[blankId];
                const correctAnswer = correctAnswers[blankId];
                const isCorrect =
                  filledWord?.trim().toLowerCase() ===
                  correctAnswer?.trim().toLowerCase();

                return (
                  <DroppableBlank
                    key={blankId}
                    id={blankId}
                    filledWord={filledWord}
                    isSubmitted={submitted}
                    isCorrect={isCorrect}
                    correctAnswer={correctAnswer}
                    onClick={() => handleBlankClick(blankId)}
                  />
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>

          {/* Word Bank */}
          {!submitted && (
            <div className="space-y-3 pt-4 border-t border-hairline">
              <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider">
                Word Bank (Drag a chip or click a chip then click a blank)
              </span>
              <div className="flex flex-wrap gap-2.5">
                {word_bank.map((word) => {
                  const isPlaced = placedWords.includes(word);
                  const isSelected = selectedWord === word;
                  return (
                    <DraggableWord
                      key={word}
                      word={word}
                      disabled={isPlaced}
                      isSelected={isSelected}
                      onClick={() => handleWordClick(word)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {validationError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-md flex items-center gap-2 animate-fade-in font-medium select-none">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-hairline">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
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

        {/* Model Answer (shows on submit) */}
        {submitted && (
          <ModelAnswer
            answer={getHighlightedModelPassage()}
            title="Completed Text Passage"
          />
        )}
      </div>
    </DndContext>
  );
}
