"use client";

import React from "react";

/**
 * The gray countdown circle shown before recording/answering starts
 * ("Recording in N seconds" / "Think time: N seconds"), matching the
 * real PTE test driver's pre-recording screen.
 */
export default function PrepCircle({
  count,
  label,
  tone = "neutral",
}: {
  count: number;
  label: string;
  tone?: "neutral" | "warning";
}) {
  const ring = tone === "warning" ? "border-amber-500 text-amber-600" : "border-gray-500 text-gray-700";
  const text = tone === "warning" ? "text-amber-600" : "text-gray-700";

  return (
    <div className="flex items-center justify-center gap-4 py-16 select-none">
      <div
        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-base font-semibold ${ring}`}
      >
        {count}
      </div>
      <span className={`text-sm font-medium ${text}`}>{label}</span>
    </div>
  );
}
