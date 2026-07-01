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
  isPremium?: boolean;
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

  const getStyles = () => {
    if (disabled) {
      return "opacity-30 border-gray-200 text-gray-400 cursor-not-allowed";
    }
    if (isSelected) {
      return "border-[#1C415A] bg-[#FAF9F6] text-zinc-900 ring-2 ring-[#1C415A]/20 cursor-pointer";
    }
    return "border-gray-300 hover:border-gray-400 text-gray-700 cursor-grab active:cursor-grabbing";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
      onClick={!disabled ? onClick : undefined}
      className={`px-3.5 py-1.5 bg-white border rounded text-[15px] font-sans select-none transition shadow-sm ${getStyles()} ${isDragging ? "opacity-50" : ""}`}
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
        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold"
        : "border-red-500 bg-red-50/50 text-red-800 font-semibold";
    }
    if (isOver) {
      return "border-[#1C415A] bg-[#FAF9F6] text-zinc-900 scale-102";
    }
    return filledWord
      ? "border-gray-400 bg-white text-gray-800 font-semibold"
      : "border-dashed border-gray-300 bg-[#EAECEF] text-gray-400";
  };

  return (
    <span className="inline-block relative mx-3 align-middle">
      <span
        ref={setNodeRef}
        onClick={!isSubmitted ? onClick : undefined}
        className={`inline-flex items-center justify-center min-w-[120px] h-9 border rounded px-3.5 text-[15px] transition duration-150 ${!isSubmitted ? "cursor-pointer hover:border-gray-500" : ""
          } ${getStyles()}`}
      >
        {filledWord || <span className="font-semibold text-[11px] text-gray-400 uppercase tracking-wider select-none">Select</span>}
      </span>
      {isSubmitted && !isCorrect && (
        <span className="text-emerald-600 text-sm font-bold ml-1.5 align-middle select-text">
          (✓ {correctAnswer})
        </span>
      )}
    </span>
  );
}

export default function ReadingFillBlanks({
  question,
  onSubmitAttempt,
  isSubmitting,
  isPremium = false,
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
        <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
          {/* Instruction Paragraph */}
          <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
            In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.
          </div>

          {/* Workspace Area */}
          <div className="p-9 bg-white space-y-8">
            {/* Passage rendering */}
            <div className="text-[17px] text-gray-800 leading-loose font-sans select-text pr-2 py-3">
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
                    <React.Fragment key={blankId}>
                      {" "}
                      <DroppableBlank
                        id={blankId}
                        filledWord={filledWord}
                        isSubmitted={submitted}
                        isCorrect={isCorrect}
                        correctAnswer={correctAnswer}
                        onClick={() => handleBlankClick(blankId)}
                      />
                      {" "}
                    </React.Fragment>
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </div>

            {/* Word Bank */}
            {!submitted && (
              <div className="pt-7 border-t border-gray-200">
                <div className="flex flex-wrap gap-3 p-5 bg-[#F3F4F6] border border-gray-200 rounded">
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

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-md flex items-center gap-2 animate-fade-in font-medium select-none">
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Silver-grey Practice Footer Panel */}
          <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-between items-center select-none rounded-b-lg">
            <div>
              {submitted && result && (
                <ScoreBadge score={result.score} maxScore={result.maxScore} />
              )}
            </div>
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "SUBMIT & CHECK"}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition"
              >
                TRY AGAIN
              </button>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
