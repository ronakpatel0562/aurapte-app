"use client";

import React from "react";
import { Check, ArrowDown } from "lucide-react";
import { EvalInstruction, EvalLabel } from "./shared";

interface Paragraph {
  id: string;
  text: string;
}

/**
 * Evaluation view for Re-order Paragraphs. PTE scores this on adjacent
 * pairs, so we show the student's sequence with the connector between two
 * tiles turning emerald when that pair matches the key, alongside the full
 * correct order for reference.
 */
export default function ReorderEvaluation({
  content,
  order,
}: {
  content: { paragraphs?: Paragraph[]; correct_order?: string[] };
  order: string[];
}) {
  const paragraphs = content.paragraphs || [];
  const correctOrder = content.correct_order || [];
  const byId = new Map(paragraphs.map((p) => [p.id, p]));

  const correctPairs = new Set<string>();
  for (let i = 0; i < correctOrder.length - 1; i++) {
    correctPairs.add(`${correctOrder[i]}-${correctOrder[i + 1]}`);
  }

  const Tile = ({ text, badge }: { text: string; badge: string }) => (
    <div className="flex items-start gap-3 p-3.5 border border-gray-300 rounded bg-white text-sm shadow-sm">
      <span className="w-6 h-6 shrink-0 rounded-full bg-[#1e7a9c] text-white text-xs font-bold flex items-center justify-center">
        {badge}
      </span>
      <span className="leading-relaxed text-gray-800">{text}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <EvalInstruction>
        The text boxes below were placed in a random order. Restore the original order by dragging
        them into the correct sequence.
      </EvalInstruction>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <EvalLabel>Your order</EvalLabel>
          <div className="space-y-0">
            {order.length === 0 && (
              <p className="text-sm text-gray-400 italic">No answer submitted.</p>
            )}
            {order.map((id, i) => {
              const para = byId.get(id);
              const pairCorrect = i > 0 && correctPairs.has(`${order[i - 1]}-${id}`);
              return (
                <div key={`${id}-${i}`}>
                  {i > 0 && (
                    <div className="flex items-center gap-1.5 py-1 pl-3">
                      <ArrowDown
                        className={`w-3.5 h-3.5 ${pairCorrect ? "text-emerald-600" : "text-gray-300"}`}
                      />
                      {pairCorrect ? (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                          Correct pair
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                          Broken pair
                        </span>
                      )}
                    </div>
                  )}
                  <Tile text={para?.text ?? id} badge={String(i + 1)} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <EvalLabel>
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Correct order
            </span>
          </EvalLabel>
          <div className="space-y-2.5">
            {correctOrder.map((id, i) => {
              const para = byId.get(id);
              return (
                <div
                  key={`${id}-${i}`}
                  className="flex items-start gap-3 p-3.5 border border-emerald-500 bg-emerald-50/50 rounded text-sm"
                >
                  <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-emerald-900">{para?.text ?? id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
