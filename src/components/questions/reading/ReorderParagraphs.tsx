"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check } from "lucide-react";
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

function SortableTile({ id, text, index, isSubmitted, correctIndex, onRemove }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isSubmitted });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  const getBorderColor = () => {
    if (isSubmitted) {
      return index === correctIndex
        ? "border-success/30 bg-success/5 text-success font-semibold"
        : "border-error/30 bg-error/5 text-error-deep";
    }
    return "border-hairline hover:border-hairline-strong bg-canvas";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 border rounded-lg text-xs relative flex items-start gap-3 transition shadow-vercel-card ${getBorderColor()} ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {!isSubmitted && (
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -m-1 text-mute hover:text-ink shrink-0 font-bold select-none text-sm"
          title="Drag to sort"
        >
          ⠿
        </div>
      )}
      <div className="flex-1 font-geist select-text pr-2 leading-relaxed">
        {text}
      </div>
      {!isSubmitted && (
        <button
          onClick={onRemove}
          className="text-3xs font-mono text-mute hover:text-error-deep transition shrink-0 cursor-pointer self-center"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function ShuffledBlock({ id, text, onAdd }: any) {
  return (
    <div
      onClick={onAdd}
      className="p-3.5 border border-hairline hover:border-hairline-strong bg-canvas hover:bg-canvas-soft transition rounded-lg text-xs font-geist cursor-pointer select-none leading-relaxed flex items-start justify-between shadow-vercel-card group"
    >
      <span className="flex-1 pr-4">{text}</span>
      <span className="text-3xs font-mono text-mute group-hover:text-primary transition shrink-0 font-bold">
        ADD +
      </span>
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

  // Initialize pool — prefer DB-provided shuffled_order if present, else random
  useEffect(() => {
    let pool: Paragraph[];
    if (Array.isArray(shuffled_order) && shuffled_order.length === paragraphs.length) {
      pool = shuffled_order
        .map((id: string) => paragraphs.find((p) => p.id === id))
        .filter((p: Paragraph | undefined): p is Paragraph => Boolean(p));
      // Fallback if any id was missing
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

    if (over && active.id !== over.id) {
      setOrderedList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
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
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-hairline">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Re-order Paragraphs
          </span>
          {submitted && result && (
            <ScoreBadge score={result.score} maxScore={result.maxScore} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[280px]">
          {/* Shuffled pool (Left) */}
          <div className="space-y-3">
            <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider block">
              Source Paragraphs
            </span>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {shuffledPool.length > 0 ? (
                shuffledPool.map((para) => (
                  <ShuffledBlock
                    key={para.id}
                    id={para.id}
                    text={para.text}
                    onAdd={() => handleAdd(para)}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-3xs text-mute border border-dashed border-hairline rounded-lg bg-canvas-soft-2 font-mono uppercase">
                  All blocks added
                </div>
              )}
            </div>
          </div>

          {/* Sorted Dropzone (Right) */}
          <div className="space-y-3">
            <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider block">
              Your Ordered Sequence
            </span>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedList.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 p-4 border border-dashed border-hairline rounded-lg bg-canvas-soft min-h-[240px] flex flex-col justify-start">
                  {orderedList.length > 0 ? (
                    orderedList.map((para, index) => {
                      const correctIndex = correct_order.indexOf(para.id);
                      return (
                        <SortableTile
                          key={para.id}
                          id={para.id}
                          text={para.text}
                          index={index}
                          correctIndex={correctIndex}
                          isSubmitted={submitted}
                          onRemove={() => handleRemove(para)}
                        />
                      );
                    })
                  ) : (
                    <div className="my-auto text-center py-12 text-3xs text-mute font-mono uppercase">
                      Select paragraphs on the left to build order
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || orderedList.length === 0}
              className="h-10 px-6 bg-primary text-on-primary hover:bg-opacity-95 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Sequence
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

      {/* Correct Sequence (shown on submit) */}
      {submitted && (
        <div className="bg-canvas border border-success/30 rounded-lg shadow-vercel-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-hairline bg-success/5">
            <Check className="w-4 h-4 text-success" />
            <span className="text-body-sm-strong font-semibold text-ink">
              Correct Sequence
            </span>
            <span className="text-3xs font-mono text-mute uppercase tracking-wider ml-auto">
              {correct_order.length} paragraphs
            </span>
          </div>

          {/* Ordered numbered cards */}
          <div className="p-4 space-y-3 bg-canvas-soft-2">
            {correct_order.map((id, idx) => {
              const para = paragraphs.find((p) => p.id === id);
              const wasPlacedAt = orderedList.findIndex((p) => p.id === id);
              const correctlyPlaced =
                wasPlacedAt !== -1 && wasPlacedAt === idx;

              return (
                <div
                  key={id}
                  className={`p-3.5 border rounded-lg text-xs leading-relaxed flex items-start gap-3 bg-canvas shadow-vercel-card ${
                    correctlyPlaced
                      ? "border-success/40"
                      : "border-error/40"
                  }`}
                >
                  {/* Step number badge */}
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono font-semibold text-3xs ${
                      correctlyPlaced
                        ? "bg-success text-on-primary"
                        : "bg-error text-on-primary"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Paragraph text */}
                  <div className="flex-1 font-geist select-text pr-2">
                    {para?.text || `Paragraph ${id}`}
                  </div>

                  {/* Placement indicator */}
                  <span
                    className={`text-3xs font-mono font-semibold uppercase tracking-wider shrink-0 ${
                      correctlyPlaced ? "text-success" : "text-error-deep"
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
