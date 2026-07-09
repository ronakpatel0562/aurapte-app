"use client";

import React from "react";

/**
 * The horizontal recording indicator shown once recording actually starts
 * — a red "RECORDING" dot + elapsed time on the left, a filling progress
 * bar in the middle, and the total duration on the right. Once time runs
 * out it flips to a gray dot + green "COMPLETED" with a full bar. This is
 * the real PTE test driver's recording widget (distinct from the prep
 * countdown circle shown beforehand).
 */
export default function RecordingMeter({
  elapsedSeconds,
  totalSeconds,
  completed,
}: {
  elapsedSeconds: number;
  totalSeconds: number;
  completed: boolean;
}) {
  const pct = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-16 select-none">
      <div className="flex items-center gap-3">
        <span
          className={`w-3.5 h-3.5 rounded-full shrink-0 ${
            completed ? "bg-gray-400" : "bg-red-600 animate-pulse"
          }`}
        />
        <div className="leading-tight">
          <div className="text-xs font-mono tabular-nums text-gray-700">
            {formatTime(elapsedSeconds)}
          </div>
          <div
            className={`text-[11px] font-bold uppercase tracking-wide ${
              completed ? "text-green-600" : "text-red-600"
            }`}
          >
            {completed ? "Completed" : "Recording"}
          </div>
        </div>
      </div>

      <div className="w-full max-w-56 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ease-linear ${
            completed ? "bg-green-500" : "bg-[#2980b9]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="text-xs font-mono tabular-nums text-gray-500">
        {formatTime(totalSeconds)}
      </span>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
