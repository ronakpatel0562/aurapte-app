"use client";

import React from "react";

/**
 * Reading & Writing: Fill in the Blanks — passage with inline <select>
 * dropdowns, one per blank. Matches the real PTE test driver exactly (see
 * the recorded reference video): plain white canvas, native <select>
 * elements, no scoring feedback while the exam is in progress — that's
 * deferred to persistAttempt on Next, same as every other exam-clone body.
 */
export default function RWFillBlanksExam({
  content,
  value,
  onChange,
}: {
  content: { passage_with_blanks?: string; dropdown_choices?: Record<string, string[]> };
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const passage = content.passage_with_blanks || "";
  const choices = content.dropdown_choices || {};
  const parts = passage.split(/(\[blank_\d+\])/g);

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-6">
        Below is a text with blanks. Click on each blank a list of choices will appear. Select the appropriate
        answer choice for each blank.
      </p>
      <div className="text-[15px] text-gray-800 leading-loose">
        {parts.map((part, index) => {
          const match = part.match(/\[(blank_\d+)\]/);
          if (match) {
            const blankId = match[1];
            const options = choices[blankId] || [];
            const selected = value[blankId] || "";
            return (
              <select
                key={blankId}
                value={selected}
                onChange={(e) => onChange({ ...value, [blankId]: e.target.value })}
                className="inline-block h-8 mx-1.5 border border-gray-400 rounded bg-white text-[14px] px-2 focus:outline-none focus:border-teal-600 align-middle"
              >
                <option value="">— Select —</option>
                {options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
}
