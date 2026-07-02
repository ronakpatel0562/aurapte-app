import React from "react";

export default function SectionIntroScreen({
  title,
  categories,
}: {
  title: string;
  categories: { label: string; count: number }[];
}) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-[#1e7a9c] mb-4">{title}</h2>
      <p className="text-sm text-gray-800 mb-3">
        In this section, there will be {total} questions across the following categories:
      </p>
      <ul className="space-y-1.5 mb-4">
        {categories.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm text-gray-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e7a9c] mt-1.5 shrink-0" />
            <span className="font-semibold">{c.label}</span>
            <span className="text-gray-500">({c.count} question{c.count === 1 ? "" : "s"})</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-200 pt-3 text-sm text-gray-700">
        Click <span className="text-[#1e7a9c] font-semibold">Next</span> to begin the questions.
      </div>
    </div>
  );
}
