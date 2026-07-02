"use client";

import React, { useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";

/**
 * Reading: Fill in the Blanks — drag words from a shared word bank into
 * blanks in the passage. Same drag mechanics as the dashboard practice
 * component (@dnd-kit), stripped of the score-on-submit feedback since the
 * exam clone defers scoring to Next, and a word can also be placed by
 * click-to-select then click-a-blank for keyboard/touch friendliness.
 */
function DraggableWord({
  word,
  disabled,
  isSelected,
  onClick,
}: {
  word: string;
  disabled: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: word,
    disabled,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const styles = disabled
    ? "opacity-30 border-gray-200 text-gray-400 cursor-not-allowed"
    : isSelected
    ? "border-teal-600 bg-teal-50 text-gray-900 ring-2 ring-teal-600/20 cursor-pointer"
    : "border-gray-300 hover:border-gray-400 text-gray-700 cursor-grab active:cursor-grabbing";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
      onClick={!disabled ? onClick : undefined}
      className={`px-3 py-1.5 bg-white border rounded text-sm select-none transition shadow-sm ${styles} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {word}
    </div>
  );
}

function DroppableBlank({
  id,
  filledWord,
  onClick,
}: {
  id: string;
  filledWord: string | undefined;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const styles = isOver
    ? "border-teal-600 bg-teal-50 text-gray-900"
    : filledWord
    ? "border-gray-400 bg-white text-gray-800 font-medium"
    : "border-dashed border-gray-400 bg-gray-100 text-gray-400";

  return (
    <span
      ref={setNodeRef}
      onClick={onClick}
      className={`inline-flex items-center justify-center min-w-[110px] h-8 border rounded px-3 mx-1.5 text-sm cursor-pointer transition align-middle ${styles}`}
    >
      {filledWord || <span className="text-[10px] uppercase tracking-wider text-gray-400">Select</span>}
    </span>
  );
}

export default function ReadingFillBlanksExam({
  content,
  value,
  onChange,
}: {
  content: { passage_with_blanks?: string; word_bank?: string[] };
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const passage = content.passage_with_blanks || "";
  const wordBank = content.word_bank || [];
  const parts = passage.split(/(\[blank_\d+\])/g);
  const placedWords = Object.values(value);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const placeWord = (blankId: string, word: string) => {
    const filtered: Record<string, string> = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v !== word) filtered[k] = v;
    });
    onChange({ ...filtered, [blankId]: word });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active) placeWord(over.id as string, active.id as string);
  };

  const handleWordClick = (word: string) => {
    setSelectedWord((prev) => (prev === word ? null : word));
  };

  const handleBlankClick = (blankId: string) => {
    if (selectedWord) {
      placeWord(blankId, selectedWord);
      setSelectedWord(null);
    } else if (value[blankId]) {
      const copy = { ...value };
      delete copy[blankId];
      onChange(copy);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="max-w-3xl space-y-8">
        <p className="text-sm font-bold text-gray-800 leading-relaxed">
          In the text below some words are missing. Drag words from the box below to the appropriate place in the
          text. To undo an answer choice, drag the word back to the box below the text.
        </p>

        <div className="text-[15px] text-gray-800 leading-loose">
          {parts.map((part, index) => {
            const match = part.match(/\[(blank_\d+)\]/);
            if (match) {
              const blankId = match[1];
              return (
                <DroppableBlank
                  key={blankId}
                  id={blankId}
                  filledWord={value[blankId]}
                  onClick={() => handleBlankClick(blankId)}
                />
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>

        <div className="flex flex-wrap gap-2.5 p-4 bg-gray-100 border border-gray-300 rounded">
          {wordBank.map((word) => (
            <DraggableWord
              key={word}
              word={word}
              disabled={placedWords.includes(word)}
              isSelected={selectedWord === word}
              onClick={() => handleWordClick(word)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
