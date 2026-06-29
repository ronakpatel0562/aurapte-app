"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreReorderParagraphs } from "@/lib/scoring/reading";

interface Paragraph {
  id: string;
  text: string;
}

interface ReorderParagraphsProps {
  question: {
    id: string;
    title: string;
    content: {
      paragraphs: Paragraph[];
      correct_order: string[];
      shuffled_order?: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

function DraggableTile({ id, text, index, isSubmitted, correctIndex, onRemove, onClick, type }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isSubmitted,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const getStyles = () => {
    if (isSubmitted && type === "target") {
      return index === correctIndex
        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold"
        : "border-red-500 bg-red-50/50 text-red-800";
    }
    return "border-gray-300 bg-white text-gray-700 hover:border-gray-400";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={!isSubmitted ? onClick : undefined}
      className={`p-3.5 border rounded text-[13px] relative flex items-start gap-3 transition shadow-sm bg-white select-none ${getStyles()} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {!isSubmitted && (
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -m-1 text-gray-400 hover:text-gray-700 shrink-0 font-bold select-none text-[16px] leading-none"
          title="Drag to move"
        >
          ⠿
        </div>
      )}
      <div className="flex-1 font-sans select-text pr-2 leading-relaxed">
        {text}
      </div>
      {!isSubmitted && type === "target" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[11px] font-bold text-red-600 hover:text-red-800 transition shrink-0 cursor-pointer self-center"
        >
          ✕
        </button>
      )}
      {isSubmitted && type === "target" && (
        <span className={`text-[11px] font-bold font-mono uppercase tracking-wider shrink-0 self-center ${index === correctIndex ? "text-emerald-700" : "text-red-700"}`}>
          {index === correctIndex ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}

function DroppableSourceContainer({ children, isSubmitted }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: "source-pool",
    disabled: isSubmitted,
  });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 p-4 overflow-y-auto flex-1 max-h-[450px] transition duration-150 rounded-lg ${
        isOver ? "bg-blue-50/60 border-2 border-dashed border-[#0b7ca5]/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DroppableTargetSlot({ index, children, isSubmitted }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    disabled: isSubmitted,
  });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[58px] rounded transition duration-150 ${
        isOver ? "bg-blue-50/80 border-2 border-dashed border-[#0b7ca5]" : ""
      }`}
    >
      {children || (
        <div className="h-[52px] border border-dashed border-gray-300 rounded bg-[#EAECEF] flex items-center justify-center text-[12px] text-gray-400 font-bold select-none font-sans">
          Place {index + 1}
        </div>
      )}
    </div>
  );
}

export default function ReorderParagraphs({
  question,
  onSubmitAttempt,
  isSubmitting,
}: ReorderParagraphsProps) {
  const { paragraphs, correct_order, shuffled_order } = question.content;

  const [shuffledPool, setShuffledPool] = useState<Paragraph[]>([]);
  const [orderedList, setOrderedList] = useState<Paragraph[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Initialize pool
  useEffect(() => {
    let pool: Paragraph[];
    if (Array.isArray(shuffled_order) && shuffled_order.length === paragraphs.length) {
      pool = shuffled_order
        .map((id: string) => paragraphs.find((p) => p.id === id))
        .filter((p: Paragraph | undefined): p is Paragraph => Boolean(p));
      if (pool.length !== paragraphs.length) pool = [...paragraphs];
    } else {
      pool = [...paragraphs];
    }
    setShuffledPool(pool);
    setOrderedList([]);
    setSubmitted(false);
    setResult(null);
  }, [question, paragraphs, shuffled_order]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;
    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 1. Drag back to source pool
    if (overId === "source-pool") {
      const found = paragraphs.find((p) => p.id === activeId);
      if (found) {
        setOrderedList((prev) => prev.filter((p) => p.id !== activeId));
        setShuffledPool((prev) => {
          if (prev.some((p) => p.id === activeId)) return prev;
          return [...prev, found];
        });
      }
      return;
    }

    // 2. Drop on a slot
    const slotMatch = overId.match(/^slot-(\d+)$/);
    if (slotMatch) {
      const targetIdx = parseInt(slotMatch[1], 10);
      const found = paragraphs.find((p) => p.id === activeId);
      if (found) {
        setShuffledPool((prev) => prev.filter((p) => p.id !== activeId));
        setOrderedList((prev) => {
          const filtered = prev.filter((p) => p.id !== activeId);
          const result = [...filtered];
          result.splice(targetIdx, 0, found);
          return result;
        });
      }
      return;
    }

    // 3. Drop on another paragraph
    const isOverParagraph = paragraphs.some((p) => p.id === overId);
    if (isOverParagraph) {
      const found = paragraphs.find((p) => p.id === activeId);
      if (found) {
        setShuffledPool((prev) => prev.filter((p) => p.id !== activeId));
        setOrderedList((prev) => {
          const filtered = prev.filter((p) => p.id !== activeId);
          const targetIdx = filtered.findIndex((p) => p.id === overId);
          const result = [...filtered];
          if (targetIdx !== -1) {
            result.splice(targetIdx, 0, found);
          } else {
            result.push(found);
          }
          return result;
        });
      }
    }
  };

  const handleAdd = (para: Paragraph) => {
    if (submitted) return;
    setOrderedList((prev) => [...prev, para]);
    setShuffledPool((prev) => prev.filter((p) => p.id !== para.id));
  };

  const handleRemove = (para: Paragraph) => {
    if (submitted) return;
    setShuffledPool((prev) => [...prev, para]);
    setOrderedList((prev) => prev.filter((p) => p.id !== para.id));
  };

  const handleSubmit = () => {
    if (submitted) return;

    const userOrderIds = orderedList.map((p) => p.id);
    const scoreResult = scoreReorderParagraphs(userOrderIds, correct_order);

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userOrderIds);
  };

  const handleReset = () => {
    setShuffledPool([...paragraphs]);
    setOrderedList([]);
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Interaction Board */}
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        {/* Instruction Paragraph */}
        <div className="px-6 py-5 bg-[#FAF9F6] text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          The text boxes in the left panel placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.
        </div>

        {/* Workspace Columns */}
        <div className="p-8 bg-white space-y-6">
          {submitted && result && (
            <div className="flex justify-end select-none">
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
              {/* Shuffled pool (Left) */}
              <div className="border border-gray-300 rounded overflow-hidden flex flex-col bg-[#F3F4F6] pb-4 shadow-sm">
                <div className="bg-[#0b7ca5] text-white text-[13px] font-bold text-center py-2 select-none uppercase tracking-wider mb-2">
                  Source
                </div>
                <DroppableSourceContainer isSubmitted={submitted}>
                  {shuffledPool.length > 0 ? (
                    shuffledPool.map((para) => (
                      <DraggableTile
                        key={para.id}
                        id={para.id}
                        text={para.text}
                        isSubmitted={submitted}
                        onClick={() => handleAdd(para)}
                        type="source"
                      />
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-gray-400 font-medium uppercase font-mono bg-white border border-dashed border-gray-300 rounded-lg">
                      All blocks added
                    </div>
                  )}
                </DroppableSourceContainer>
              </div>

              {/* Sorted Dropzone (Right) */}
              <div className="border border-gray-300 rounded overflow-hidden flex flex-col bg-[#F3F4F6] pb-4 shadow-sm">
                <div className="bg-[#0b7ca5] text-white text-[13px] font-bold text-center py-2 select-none uppercase tracking-wider mb-2">
                  Target
                </div>
                <div className="p-4 flex-1 space-y-3 max-h-[450px] overflow-y-auto">
                  {Array.from({ length: paragraphs.length }).map((_, index) => {
                    const para = orderedList[index];
                    const slotChild = para ? (
                      <DraggableTile
                        key={para.id}
                        id={para.id}
                        text={para.text}
                        index={index}
                        correctIndex={correct_order.indexOf(para.id)}
                        isSubmitted={submitted}
                        onRemove={() => handleRemove(para)}
                        type="target"
                      />
                    ) : null;

                    return (
                      <DroppableTargetSlot
                        key={`slot-${index}`}
                        index={index}
                        isSubmitted={submitted}
                      >
                        {slotChild}
                      </DroppableTargetSlot>
                    );
                  })}
                </div>
              </div>
            </div>
          </DndContext>
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || orderedList.length === 0}
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

      {/* Correct Sequence (shown on submit) */}
      {submitted && (
        <div className="bg-white border border-emerald-500 rounded-lg shadow-sm overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-emerald-100 bg-emerald-50/50 select-none">
            <span className="text-[14px] font-bold text-emerald-800">
              Correct Sequence
            </span>
            <span className="text-[11px] font-bold font-mono text-emerald-600 uppercase tracking-wider ml-auto">
              {correct_order.length} paragraphs
            </span>
          </div>

          {/* Ordered numbered cards */}
          <div className="p-6 space-y-3 bg-[#FAF9F6]">
            {correct_order.map((id, idx) => {
              const para = paragraphs.find((p) => p.id === id);
              const wasPlacedAt = orderedList.findIndex((p) => p.id === id);
              const correctlyPlaced =
                wasPlacedAt !== -1 && wasPlacedAt === idx;

              return (
                <div
                  key={id}
                  className={`p-3.5 border rounded text-[13px] leading-relaxed flex items-start gap-3 bg-white shadow-sm ${
                    correctlyPlaced
                      ? "border-emerald-500 text-emerald-800"
                      : "border-red-500 text-red-800"
                  }`}
                >
                  {/* Step number badge */}
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      correctlyPlaced
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Paragraph text */}
                  <div className="flex-1 font-sans select-text pr-2 leading-relaxed">
                    {para?.text || `Paragraph ${id}`}
                  </div>

                  {/* Placement indicator */}
                  <span
                    className={`text-[11px] font-bold font-mono uppercase tracking-wider shrink-0 self-center ${
                      correctlyPlaced ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {wasPlacedAt === -1
                      ? "Not placed"
                      : correctlyPlaced
                      ? "Correct"
                      : `You placed #${wasPlacedAt + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
