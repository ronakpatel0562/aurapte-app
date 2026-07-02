"use client";

import React, { useEffect, useState } from "react";
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

interface Paragraph {
  id: string;
  text: string;
}

/**
 * Re-order Paragraphs — drag paragraph tiles from the shuffled "Source"
 * panel into the "Target" panel to restore the original order. Same
 * two-panel drag mechanics as the dashboard practice component, stripped
 * of the score-on-submit / correct-sequence reveal since the exam clone
 * defers scoring to Next.
 */
function DraggableTile({
  id,
  text,
  onRemove,
  onClick,
  isTarget,
}: {
  id: string;
  text: string;
  onRemove?: () => void;
  onClick?: () => void;
  isTarget: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`p-3.5 border border-gray-300 rounded bg-white text-sm relative flex items-start gap-3 shadow-sm select-none ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing p-1 -m-1 text-gray-400 hover:text-gray-700 shrink-0 font-bold text-base leading-none"
        title="Drag to move"
      >
        ⠿
      </div>
      <div className="flex-1 leading-relaxed pr-2">{text}</div>
      {isTarget && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[11px] font-bold text-red-600 hover:text-red-800 shrink-0 self-center"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function DroppableSource({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "source-pool" });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2.5 p-3 flex-1 min-h-[200px] rounded transition ${isOver ? "bg-teal-50/60" : ""}`}
    >
      {children}
    </div>
  );
}

function DroppableSlot({ index, children }: { index: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });
  return (
    <div ref={setNodeRef} className={`rounded transition ${isOver ? "bg-teal-50/80" : ""}`}>
      {children || (
        <div className="h-[52px] border border-dashed border-gray-300 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
          Place {index + 1}
        </div>
      )}
    </div>
  );
}

export default function ReorderParagraphsExam({
  content,
  value,
  onChange,
}: {
  content: { paragraphs?: Paragraph[]; shuffled_order?: string[] };
  value: string[];
  onChange: (order: string[]) => void;
}) {
  const paragraphs = content.paragraphs || [];
  const [pool, setPool] = useState<Paragraph[]>([]);

  useEffect(() => {
    const placedIds = new Set(value);
    let initialPool: Paragraph[];
    if (Array.isArray(content.shuffled_order) && content.shuffled_order.length === paragraphs.length) {
      initialPool = content.shuffled_order
        .map((id) => paragraphs.find((p) => p.id === id))
        .filter((p): p is Paragraph => Boolean(p));
    } else {
      initialPool = [...paragraphs];
    }
    setPool(initialPool.filter((p) => !placedIds.has(p.id)));
    // Only re-derive the pool when the question itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const orderedList = value
    .map((id) => paragraphs.find((p) => p.id === id))
    .filter((p): p is Paragraph => Boolean(p));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const findParagraph = (id: string) => paragraphs.find((p) => p.id === id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const found = findParagraph(activeId);
    if (!found) return;

    if (overId === "source-pool") {
      onChange(value.filter((id) => id !== activeId));
      setPool((prev) => (prev.some((p) => p.id === activeId) ? prev : [...prev, found]));
      return;
    }

    const slotMatch = overId.match(/^slot-(\d+)$/);
    const targetIdx = slotMatch
      ? parseInt(slotMatch[1], 10)
      : value.findIndex((id) => id === overId);
    if (targetIdx === -1 && !slotMatch) return;

    setPool((prev) => prev.filter((p) => p.id !== activeId));
    const filtered = value.filter((id) => id !== activeId);
    const insertAt = slotMatch ? targetIdx : filtered.indexOf(overId);
    const next = [...filtered];
    next.splice(insertAt === -1 ? next.length : insertAt, 0, activeId);
    onChange(next);
  };

  const handleAdd = (para: Paragraph) => {
    onChange([...value, para.id]);
    setPool((prev) => prev.filter((p) => p.id !== para.id));
  };

  const handleRemove = (para: Paragraph) => {
    setPool((prev) => [...prev, para]);
    onChange(value.filter((id) => id !== para.id));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-sm font-bold text-gray-800 leading-relaxed">
        The text boxes in the left panel have been placed in a random order. Restore the original order by dragging
        the text boxes from the left panel to the right panel.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[260px]">
          <div className="border border-gray-300 rounded overflow-hidden flex flex-col bg-gray-50">
            <div className="bg-[#1e7a9c] text-white text-xs font-bold text-center py-2 uppercase tracking-wider">
              Source
            </div>
            <DroppableSource>
              {pool.length > 0 ? (
                pool.map((para) => (
                  <DraggableTile
                    key={para.id}
                    id={para.id}
                    text={para.text}
                    isTarget={false}
                    onClick={() => handleAdd(para)}
                  />
                ))
              ) : (
                <div className="py-10 text-center text-xs text-gray-400 font-medium uppercase bg-white border border-dashed border-gray-300 rounded">
                  All blocks added
                </div>
              )}
            </DroppableSource>
          </div>

          <div className="border border-gray-300 rounded overflow-hidden flex flex-col bg-gray-50">
            <div className="bg-[#1e7a9c] text-white text-xs font-bold text-center py-2 uppercase tracking-wider">
              Target
            </div>
            <div className="p-3 flex-1 space-y-2.5">
              {Array.from({ length: paragraphs.length }).map((_, index) => {
                const para = orderedList[index];
                return (
                  <DroppableSlot key={`slot-${index}`} index={index}>
                    {para ? (
                      <DraggableTile
                        id={para.id}
                        text={para.text}
                        isTarget
                        onRemove={() => handleRemove(para)}
                      />
                    ) : null}
                  </DroppableSlot>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
